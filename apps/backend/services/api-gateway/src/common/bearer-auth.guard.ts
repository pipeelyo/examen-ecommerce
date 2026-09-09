import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";

const DEMO_TOKEN = "demo";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function resolveJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
  }
  return jwks;
}

/**
 * El CONTRACT.md del front solo exige presencia de Bearer no vacio (el login
 * de botones manda el literal "demo"). Ademas de eso, acepta un JWT real de
 * Supabase Auth (verificado contra su JWKS publico, sin llamar a Supabase en
 * cada request — jose cachea el JWKS) para el login con Google — ver
 * sdd/services/08-real-database-and-auth.md §0 y §2. Ninguno de los dos
 * caminos resuelve roles todavia: cualquier Bearer valido (demo o JWT real)
 * pasa igual para /checkout y /orders/:id.
 */
@Injectable()
export class BearerAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = request.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Falta token Bearer" });
    }
    if (token === DEMO_TOKEN) {
      return true;
    }

    const jwksSet = resolveJwks();
    if (!jwksSet) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Token invalido" });
    }
    try {
      await jwtVerify(token, jwksSet);
      return true;
    } catch {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Token invalido o expirado" });
    }
  }
}
