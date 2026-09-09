# `08-real-database-and-auth` — Crear la BD real en Supabase + paridad con el ER

> Motivo: la base de datos que documenta el SDD original (`sdd/sdd-core-ecommerce.html`, fig. 4 — Users/Roles/Carts/ServiceAccounts/auditoría) nunca se creó en Supabase. Hoy solo existen (parcialmente) los 3 schemas pragmáticos que ya construimos: `catalog`, `coupon`, `order`. Este documento cierra la brecha completa — coder la ejecuta con su MCP de Supabase sobre el mismo proyecto donde ya vive `coupon.coupons` (`cgnqftclzhgjlzollzye`).

## 0. Un conflicto que hay que resolver ANTES de tocar código — léelo primero

El SDD original dice que `SupabaseAuthGuard` **verifica la firma real del JWT contra el JWKS de Supabase**. Pero el `CONTRACT.md` congelado del front (que ya cerramos en `07-frontend-integration.md`) dice textualmente: *"Token demo literal `'demo'`"* — el front nunca inicia sesión contra Supabase Auth, manda el string `"demo"` a pelo en el header `Authorization: Bearer demo`.

Si reemplazo `BearerAuthGuard` (que hoy solo exige "hay un Bearer no vacío") por un verificador real de JWT de Supabase, **el checkout del front frozen empieza a devolver 401 siempre** — `"demo"` no es un JWT válido y nunca lo va a ser mientras el front no cambie su login. Eso rompería el trabajo que acabamos de cerrar en el punto 6 de las 7 correcciones.

**Resolución que voy a aplicar** (avísame si la quieres distinta):

- `BearerAuthGuard` en `POST /checkout` y `GET /orders/:id` **no se toca** — sigue validando solo presencia de Bearer, porque esas son las rutas que el `CONTRACT.md` gobierna y el front real les pega con `"demo"`.
- Construyo `SupabaseAuthGuard` + `RolesGuard` + el schema `identity` completos y funcionales, listos para el día que el front deje de usar el token demo y pase a loguearse de verdad contra Supabase Auth (o para proteger rutas *nuevas* que el `CONTRACT.md` no gobierna, p.ej. si más adelante exponemos `/api/v1/admin/audit` tal como lo planeaba `06-api-gateway.md`).
- Esto significa: la infraestructura de auth real queda **construida y probada, pero no conectada a las rutas del contrato** hasta que el front la necesite. Es la misma lógica que ya aplicamos con `AdminGuard` (sustituto MVP documentado) — aquí simplemente construimos el reemplazo real en paralelo, sin encender el switch todavía.

## 1. Los 5 schemas y quién es dueño de qué

Tabla tal como la define el SDD original (§06), con lo que ya existe marcado:

| Schema | Dueño | Tablas | Estado |
|---|---|---|---|
| `catalog` | catalog-service | `products`, `categories` | ✅ ya migrado y en uso |
| `coupon` | coupon-service | `coupons` | ✅ ya migrado y en uso |
| `order` | order-service | `orders`, `order_items`, `outbox_events` | ✅ ya migrado — le faltan columnas (§5) |
| `identity` | Compartido, **solo lectura** desde api-gateway | `users`, `roles`, `user_roles` | ❌ no existe — este documento lo crea |
| `audit` | Escrito solo por triggers, leído solo por `role_admin` | `_x27f_evt_trace` | ❌ no existe — este documento lo crea |

Regla que ya seguíamos y se mantiene igual: *"Ningún servicio hace un JOIN cruzando el schema de otro — si `order-service` necesita el nombre de un producto, se lo pide a `catalog-service` por HTTP y lo guarda como snapshot."* Todo lo de abajo respeta esto: agrego **FKs reales a nivel de Postgres** donde el diagrama las pide (integridad referencial real), pero **ningún Prisma schema modela esas FKs como relación** — quedan como columnas escalares opacas, así que ningún ORM intenta un join cruzado. Postgres valida la integridad; la app sigue pidiendo los datos por HTTP como hasta ahora.

## 2. `identity` — roles, users, user_roles

Supabase ya tiene `auth.users` (lo gestiona Supabase Auth). `identity.users` es un espejo de solo columnas propias, sincronizado por trigger — así el resto del sistema nunca depende de la tabla interna de Supabase Auth, solo de la nuestra.

```sql
-- migrations/010_identity_schema.sql (Prisma migration escrita a mano, igual que la de auditoria del SDD original)
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.roles (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE  -- 'CUSTOMER' | 'ADMIN'
);

CREATE TABLE identity.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_uid  UUID NOT NULL UNIQUE,      -- FK logica a auth.users(id), sin constraint formal (schema distinto, gestionado por Supabase)
  email         TEXT NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.user_roles (
  user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Trigger: cada signup real en Supabase Auth crea su espejo en identity.users
-- con el rol CUSTOMER por defecto.
CREATE OR REPLACE FUNCTION identity.handle_new_auth_user() RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_customer_role_id UUID;
BEGIN
  INSERT INTO identity.users (supabase_uid, email)
  VALUES (NEW.id, NEW.email)
  RETURNING id INTO v_user_id;

  SELECT id INTO v_customer_role_id FROM identity.roles WHERE name = 'CUSTOMER';
  INSERT INTO identity.user_roles (user_id, role_id) VALUES (v_user_id, v_customer_role_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION identity.handle_new_auth_user();
```

Seed de roles (una sola vez, vía el mismo `prisma db seed` que ya usamos en los demás servicios):

```sql
INSERT INTO identity.roles (name) VALUES ('CUSTOMER'), ('ADMIN') ON CONFLICT (name) DO NOTHING;
```

### api-gateway necesita su primer cliente de base de datos

Hoy `api-gateway` es 100% proxy HTTP — cero dependencia de datos. Para que `RolesGuard` resuelva roles por `supabase_uid`, necesita leer `identity.user_roles`. Le agrego un Prisma schema propio, **de solo lectura** (nunca corre `prisma migrate` desde aquí — la migración de `identity` vive en el script de arriba, ejecutado una sola vez por quien tenga el MCP de Supabase):

```prisma
// api-gateway/prisma/schema.prisma (nuevo)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("IDENTITY_DATABASE_URL") // misma instancia, ?schema=identity
}

model User {
  id          String @id @default(uuid())
  supabaseUid String @unique @map("supabase_uid")
  email       String
  displayName String? @map("display_name")
  roles       UserRole[]

  @@map("users")
}

model Role {
  id    String @id @default(uuid())
  name  String @unique
  users UserRole[]

  @@map("roles")
}

model UserRole {
  userId String @map("user_id")
  roleId String @map("role_id")
  user   User   @relation(fields: [userId], references: [id])
  role   Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
  @@map("user_roles")
}
```

```ts
// api-gateway/src/auth/roles.repository.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function findRolesBySupabaseUid(supabaseUid: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { supabaseUid },
    include: { roles: { include: { role: true } } },
  });
  return user?.roles.map((r) => r.role.name) ?? [];
}
```

```ts
// api-gateway/src/auth/supabase-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { findRolesBySupabaseUid } from "./roles.repository";

const jwks = createRemoteJWKSet(new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

export interface AuthenticatedUser {
  supabaseUid: string;
  email: string;
  roles: string[];
}

/**
 * Verificacion REAL del JWT de Supabase Auth (JWKS cacheado por `jose`, sin
 * llamar a Supabase en cada request). No se usa todavia en las rutas del
 * CONTRACT.md (ver §0 de este documento) — el front sigue mandando el token
 * demo literal mientras no tenga login real.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthenticatedUser;
    }>();
    const header = request.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Falta token Bearer" });
    }

    try {
      const { payload } = await jwtVerify(token, jwks);
      const supabaseUid = String(payload.sub);
      const roles = await findRolesBySupabaseUid(supabaseUid);
      request.user = { supabaseUid, email: String(payload.email ?? ""), roles };
      return true;
    } catch {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Token invalido o expirado" });
    }
  }
}
```

```ts
// api-gateway/src/auth/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "./supabase-auth.guard";

export function RequireRole(role: string) {
  @Injectable()
  class RoleGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
      if (!request.user?.roles.includes(role)) {
        throw new ForbiddenException({ code: "FORBIDDEN", message: `Requiere rol ${role}` });
      }
      return true;
    }
  }
  return RoleGuard;
}
```

`RequireRole` se usaría como `@UseGuards(SupabaseAuthGuard, RequireRole("ADMIN"))` el día que una ruta nueva (no gobernada por `CONTRACT.md`) lo necesite — por ejemplo si retomamos `/api/v1/admin/audit` de `06-api-gateway.md`.

## 3. `audit` — tabla con nombre ofuscado, trigger genérico, firma HMAC

Esto es prácticamente literal del SDD original (`sdd/sdd-core-ecommerce.html`, §06) — lo único que cambio es adaptarlo a que las tablas sensibles viven en schemas distintos (`catalog.products`, `coupon.coupons`, `order.orders`), no todas en `public`:

```sql
-- migrations/011_audit_triggers.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit._x27f_evt_trace (
  id             BIGSERIAL PRIMARY KEY,
  entity_name    TEXT NOT NULL,          -- tabla origen (products, orders, coupons...)
  operation      TEXT NOT NULL,          -- INSERT | UPDATE | DELETE
  row_pk         TEXT NOT NULL,
  actor          TEXT,                   -- current_setting('app.current_user', true)
  old_data       JSONB,
  new_data       JSONB,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  hmac_signature TEXT NOT NULL           -- integridad: hmac(fila, clave de servidor)
);

-- Solo el rol ADMIN puede leerla directamente
REVOKE ALL ON audit._x27f_evt_trace FROM PUBLIC;
GRANT SELECT ON audit._x27f_evt_trace TO role_admin;

CREATE OR REPLACE FUNCTION audit._x27f_capture() RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD) END;
  v_new JSONB := CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN row_to_json(NEW) END;
BEGIN
  INSERT INTO audit._x27f_evt_trace(entity_name, operation, row_pk, actor, old_data, new_data, hmac_signature)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id::text, OLD.id::text),
    current_setting('app.current_user', true),
    v_old,
    v_new,
    encode(hmac(TG_TABLE_NAME || TG_OP || COALESCE(NEW.id::text, OLD.id::text) || COALESCE(v_new::text, v_old::text),
      current_setting('app.audit_hmac_key'), 'sha256'), 'hex')
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_products_audit AFTER INSERT OR UPDATE OR DELETE ON catalog.products
  FOR EACH ROW EXECUTE FUNCTION audit._x27f_capture();
CREATE TRIGGER trg_orders_audit AFTER INSERT OR UPDATE OR DELETE ON order.orders
  FOR EACH ROW EXECUTE FUNCTION audit._x27f_capture();
CREATE TRIGGER trg_coupons_audit AFTER INSERT OR UPDATE OR DELETE ON coupon.coupons
  FOR EACH ROW EXECUTE FUNCTION audit._x27f_capture();
```

`app.audit_hmac_key` se setea por sesión de conexión (`SET app.audit_hmac_key = '...'`) o, más simple para Supabase, como parámetro de rol vía `ALTER DATABASE ... SET app.audit_hmac_key = '<secreto>'` — coder lo hace una vez con su MCP, el valor va al mismo lugar que ya guardamos `INTERNAL_SERVICE_TOKEN`/`ADMIN_API_TOKEN` (GitHub Secrets → k8s Secret), no se hardcodea.

No hace falta tocar ningún servicio para esto — los triggers corren en Postgres, invisibles a Prisma. `role_admin` es un rol de Postgres (no confundir con el rol de aplicación `ADMIN` de `identity.roles`); si no existe todavía: `CREATE ROLE role_admin;`.

## 4. `service_accounts` y `cart`/`cart_items` — honestidad sobre qué queda inerte

Full parity con el diagrama significa que estas tablas **existen**, pero ninguna tiene código de aplicación consumiéndolas todavía — y no deberían tenerlo hasta que haya una razón real de negocio, para no violar "no inventes rutas que el `CONTRACT.md` no pide" (`docs/plans/CONTRACT.md`, regla explícita del front) ni el principio YAGNI.

```sql
-- migrations/012_service_accounts_and_cart.sql
CREATE TABLE identity.service_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,       -- 'order-service', 'inventory-worker', etc.
  gcp_sa_email TEXT,
  api_key_hash TEXT
);

CREATE SCHEMA IF NOT EXISTS cart;

CREATE TABLE cart.carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart.cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES cart.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,   -- referencia logica a catalog.products(id); no hay FK real
                              -- porque en catalog.products los ids del CONTRACT (p-laptop...)
                              -- ya no son UUID (ver 07-frontend-integration.md, punto 2) —
                              -- una FK real aqui rompe justo lo que acabamos de arreglar.
  quantity   INT NOT NULL CHECK (quantity > 0)
);
```

Por qué quedan sin dueño ni rutas, explícitamente:

- **`service_accounts`**: el propio SDD original resuelve la autenticación servicio-a-servicio con el header compartido `X-Internal-Token` (§08 de `sdd-core-ecommerce.html`) y dice que el reemplazo real es mTLS vía Workload Identity de GKE — **no** una fila de esta tabla verificada en cada request. Existe para trazabilidad/documentación (qué cuentas de servicio hay), no para autorización activa.
- **`cart`/`cart_items`**: en todo el SDD original (2200+ líneas de texto) no hay una sola HU, ruta o descripción de servicio que las use — solo aparecen en el diagrama ER. El `CONTRACT.md` del front tampoco tiene ninguna ruta de carrito: el carrito vive en memoria del cliente (Zustand) y solo se manda como `items[]` al momento de preview/checkout. Crear las tablas cierra la paridad de esquema que pediste; conectarles una API sería construir una feature que nadie especificó.
- Nota aparte: `cart_items.product_id` **no lleva FK real** a `catalog.products(id)` a propósito — desde el punto 2 de `07-frontend-integration.md`, esos ids son strings fijos (`p-laptop`) en vez de UUID, así que una FK tipada `UUID REFERENCES catalog.products(id)` sería directamente incompatible. Si el día de mañana se conecta un cart-service real, validar `product_id` contra el catálogo se hace por HTTP, no por FK — mismo principio que ya aplicamos en todos lados.

## 5. `order-service` — de campos planos a `guest_info_enc` (JWE) + `coupon_id` con FK real

### 5.1 Qué cambia en el schema

```diff
 model Order {
   id                     String      @id @default(uuid())
   userId                 String?     @map("user_id")
-  guestFullName          String?     @map("guest_full_name")
-  guestEmail             String?     @map("guest_email")
-  guestPhone             String?     @map("guest_phone")
-  guestAddress           String?     @map("guest_address")
+  guestInfoEnc           Bytes?      @map("guest_info_enc")
+  couponId               String?     @map("coupon_id")
   originalSubtotal       Int         @map("original_subtotal")
   ...
```

`couponId` y `userId` quedan como columnas escalares simples (sin `@relation` en Prisma) — la FK real se agrega por SQL crudo, no por Prisma, exactamente por la misma razón explicada en la sección 1:

```sql
-- migrations/013_order_fk_integrity.sql
ALTER TABLE "order".orders
  ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupon.coupons(id),
  ADD CONSTRAINT fk_orders_user   FOREIGN KEY (user_id)   REFERENCES identity.users(id);
```

`order_items.product_id` **se queda como está, sin FK** — ya lo justifica la propia leyenda de tu diagrama ("`order_items` guarda 'snapshots' de precio/categoría para que una orden histórica nunca cambie si el catálogo cambia después") y además choca con el mismo problema de ids no-UUID que `cart_items`.

### 5.2 Cifrado JWE del bloque de invitado (HU5)

Nuevo módulo puro, testeable sin red — usa `jose` (agregar a `package.json` de `order-service`):

```ts
// order-service/src/orders/guest-info.crypto.ts
import { EncryptJWT, jwtDecrypt } from "jose";
import type { GuestInfo } from "./orders.repository";

function keyFromEnv(): Uint8Array {
  const secret = process.env.JWE_SECRET;
  if (!secret) throw new Error("JWE_SECRET no configurado");
  return Buffer.from(secret, "base64");
}

export async function encryptGuestInfo(info: GuestInfo): Promise<Buffer> {
  const jwt = await new EncryptJWT({ ...info })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(keyFromEnv());
  return Buffer.from(jwt, "utf-8");
}

export async function decryptGuestInfo(blob: Buffer): Promise<GuestInfo> {
  const { payload } = await jwtDecrypt(blob.toString("utf-8"), keyFromEnv());
  return payload as unknown as GuestInfo;
}
```

`JWE_SECRET` es una clave simétrica de 32 bytes en base64 (`openssl rand -base64 32`) — va a GitHub Secrets → k8s Secret `order-service-secrets`, igual patrón que `DATABASE_URL`.

### 5.3 `orders.repository.ts` — usa el cifrado y persiste `couponId`

```diff
+import { encryptGuestInfo } from "./guest-info.crypto";
+
 export interface CreateOrderInput {
   userId: string | null;
+  couponId?: string;
   guestInfo?: GuestInfo;
   breakdown: CheckoutBreakdown;
   lines: OrderLineSnapshot[];
 }
 ...
   async createOrder(input: CreateOrderInput): Promise<PersistedOrder> {
+    const guestInfoEnc = input.guestInfo ? await encryptGuestInfo(input.guestInfo) : undefined;
     return prisma.$transaction(async (tx) => {
       const order = await tx.order.create({
         data: {
           userId: input.userId,
-          guestFullName: input.guestInfo?.fullName,
-          guestEmail: input.guestInfo?.email,
-          guestPhone: input.guestInfo?.phone,
-          guestAddress: input.guestInfo?.address,
+          guestInfoEnc,
+          couponId: input.couponId,
```

### 5.4 `checkout.saga.ts` y coupon-service — threading del `couponId`

`coupon-service`'s `resolveCoupon` hoy NO devuelve el `id` del cupón, solo `{scope, categoryName, discountPercent}`. Hay que agregarlo:

```diff
 // coupon-service/src/resolve-coupon.ts
 export interface ResolvedCoupon {
   scope: CouponScope;
   categoryName?: string;
   discountPercent: number;
+  id: string;
 }
 ...
   return {
     applied: true,
     coupon: {
+      id: record.id,
       scope: record.scope,
       categoryName: record.categoryName ?? undefined,
       discountPercent: record.discountPercent,
     },
   };
```

Y `order-service`'s `checkout.saga.ts` pasa ese id a `orders.repository.ts`:

```diff
       const resolvedCoupon = await this.resolveCoupon(input.couponCode);
       const breakdown = await this.discount.calculate({ ... });
       const orderInput: CreateOrderInput = {
         userId: input.userId ?? null,
+        couponId: resolvedCoupon?.id,
         guestInfo: input.guestInfo,
```

(`resolvedCoupon` sigue pasando solo `{scope, categoryName, discountPercent}` al `discount.calculate()` — el motor no necesita el id, así que no le cambia el contrato.)

## 6. Orden de ejecución para coder (usando su MCP de Supabase)

1. `migrations/010_identity_schema.sql` → `011_audit_triggers.sql` → `012_service_accounts_and_cart.sql` → `013_order_fk_integrity.sql`, en ese orden (013 depende de que `identity.users` y `coupon.coupons` ya existan).
2. `INSERT` del seed de roles (`CUSTOMER`, `ADMIN`).
3. `ALTER DATABASE ... SET app.audit_hmac_key = '<secreto generado>'` (una vez).
4. `openssl rand -base64 32` → `JWE_SECRET` → GitHub Secret → k8s Secret de `order-service-secrets`.
5. `npm install jose` en `order-service` y en `api-gateway`; nuevo `api-gateway/prisma/schema.prisma` + `IDENTITY_DATABASE_URL` (mismo host, `?schema=identity`) como env var/secret nuevo.
6. Aplicar los diffs de la sección 5 en `order-service` y `coupon-service`; construir `api-gateway/src/auth/*` de la sección 2.
7. `prisma migrate deploy` de `order-service` (agrega `guest_info_enc`/`coupon_id`, quita las 4 columnas de invitado planas — es una migración destructiva sobre columnas que hoy están vacías en producción real, así que es segura de correr).
8. Tests + build en verde en los 3 servicios tocados antes de comitear (mismo flujo que siempre).

## 7. Qué NO se resuelve aquí (y por qué está bien)

- `SupabaseAuthGuard`/`RolesGuard` quedan construidos y con tests, pero **no reemplazan `BearerAuthGuard`** en `/checkout` ni `/orders/:id` — ver §0. Conectar el login real de Supabase Auth en el front es un cambio de alcance del propio front (fuera de lo que `CONTRACT.md` permite tocar).
- No se implementa Row-Level Security (RLS) de Supabase sobre `identity`/`cart` — el SDD original no la detalla con políticas concretas más allá de "el backend usa `service_role key`, el front usaría `anon key`", y el front real no habla directo con Supabase (todo pasa por `api-gateway`), así que RLS no tiene consumidor activo todavía.
- `service_accounts`/`cart`/`cart_items` quedan sin API — ver §4.
