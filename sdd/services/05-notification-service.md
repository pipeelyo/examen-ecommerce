# `notification-service`

> El más pequeño de los seis. Solo escucha. Ver SDD §09.

## 1. Responsabilidad (y qué NO hace)

| Hace | No hace |
|---|---|
| Se suscribe al canal Redis `order.events` y reacciona a `OrderConfirmed` | No expone ningún endpoint HTTP público — no hay nada que llamarlo desde afuera |
| Envía la confirmación al cliente (stub/log en el MVP; email real en Enterprise) | No decide nada de negocio, no toca la base de datos de `order-service` |

## 2. Prerrequisitos

- Redis corriendo.
- `order-service` corriendo y publicando en `order.events` (para probar de punta a punta; para pruebas unitarias no hace falta).

## 3. Variables de entorno

```
REDIS_URL=redis://redis:6379
NODE_ENV=development
```

Nota: este servicio no necesita `PORT` — no escucha HTTP, solo un proceso de suscripción en segundo plano (`@nestjs/microservices`, `Transport.REDIS`).

## 4. Estructura de carpetas

```
services/notification-service/
├── src/
│   ├── notifications/
│   │   ├── notifications.controller.ts   # @EventPattern('order.events')
│   │   └── notifications.service.ts
│   └── main.ts                            # NestFactory.createMicroservice(Transport.REDIS)
├── test/unit/
│   └── notifications.service.spec.ts
├── Dockerfile
└── package.json
```

## 5. Implementación

```ts
// main.ts
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: { host: 'redis', port: 6379 },
});
await app.listen();
```

```ts
// notifications.controller.ts
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern('order.events')
  async handleOrderEvent(@Payload() event: OrderConfirmedEvent) {
    if (event.eventType !== 'OrderConfirmed') return;
    await this.notifications.sendConfirmation(event);
  }
}
```

```ts
// notifications.service.ts — stub para el MVP, interfaz lista para Enterprise
export class NotificationsService {
  async sendConfirmation(event: OrderConfirmedEvent): Promise<void> {
    // MVP: log estructurado (pino) — suficiente para demostrar el flujo en la sustentacion
    logger.info({ orderId: event.aggregateId }, 'Order confirmed — notification sent (stub)');
    // Enterprise: aqui se conecta un proveedor real de email/SMS
  }
}
```

## 6. Pruebas unitarias — 80% mínimo

- `handleOrderEvent` ignora eventos que no sean `OrderConfirmed` (por si el canal se reutiliza para otros tipos en el futuro).
- `sendConfirmation` se invoca exactamente una vez por evento válido.
- Si `sendConfirmation` lanza una excepción, no debe tumbar el proceso — solo loguear el error (SDD §10: la publicación es eventual, no crítica).

```ts
coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } }
```

Comando: `pnpm --filter notification-service test:coverage`

## 7. Cómo correrlo localmente

```bash
docker compose up -d redis order-service
pnpm --filter notification-service dev
```

No hay puerto que visitar — verifica que funciona mirando los logs mientras haces un checkout real contra `order-service`.

## 8. Despliegue en GCP

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

```yaml
# Sin Service — este pod no recibe trafico entrante, solo se conecta a Redis
apiVersion: apps/v1
kind: Deployment
metadata: { name: notification-service, namespace: ecommerce-prod }
spec:
  replicas: 1   # un solo consumidor basta para el volumen del MVP
  selector: { matchLabels: { app: notification-service } }
  template:
    metadata: { labels: { app: notification-service } }
    spec:
      containers:
        - name: notification-service
          image: REGION-docker.pkg.dev/PROJECT/repo/notification-service:SHA
          envFrom: [{ secretRef: { name: notification-service-secrets } }]   # REDIS_URL
```

## 9. Definition of Done

- [ ] Recibe y procesa un `OrderConfirmed` real publicado por `order-service` (prueba manual end-to-end, no solo mockeada).
- [ ] Un fallo en `sendConfirmation` no tumba el proceso (verificado con un test que fuerza la excepción).
- [ ] Cobertura ≥80%.
