# Guion — Sustentación técnica (15 min, 15 slides)

Tiempo total objetivo: ~13 min de habla + 2 min de colchón. Habla directo, no leas el bullet — el bullet es el gancho visual, vos decís la frase completa.

---

## 1. Portada — 15 seg
"Buenas [tardes/días]. Les voy a presentar Core E-Commerce, el examen técnico Kata E1: un sistema de descuentos acumulativos con 6 microservicios reales, corriendo hoy en producción sobre GKE."

## 2. Agenda — 30 seg
"La sustentación tiene 5 bloques: qué exigía el enunciado, las decisiones de diseño del motor y el checkout, el stack tecnológico y cómo escalaría con más carga, la infraestructura de despliegue, y cierro con calidad y el estado real del sistema."

## 3. Qué exige el enunciado — 1:00
"El enunciado pide un motor de descuentos en cascada: categoría 10%, volumen 5%, cupón — nunca se suman, se multiplican en cadena — con un tope absoluto del 35% sobre el subtotal original. Son 6 historias de usuario obligatorias: catálogo, checkout de invitado, cupones, inventario y auditoría. Y exige cobertura de test de al menos 80%, más estricta en el motor y en cupones.

La decisión más importante que tomamos fue de alcance: diseñamos el proyecto en dos niveles, MVP — lo que ven corriendo ahora mismo en producción — y Enterprise, piezas documentadas y con interfaces ya listas, pero cuya infraestructura pesada no levantamos para esta entrega, porque el enunciado evalúa criterio de ingeniería, no cantidad de código."

## 4. Idempotencia — 1:15
"Una decisión de diseño que quiero destacar es dónde usamos idempotencia y dónde no. El endpoint de preview — el que recalcula el total cada vez que agregás un producto o escribís un cupón — es puramente idempotente: mismo carrito, mismo cupón, mismo resultado, siempre, porque es cómputo puro sin persistencia ni reserva de stock. Por eso es seguro llamarlo en cada tecleo.

El checkout de confirmación es distinto: ahí SÍ hay efectos reales — reserva de stock, se persiste la orden. Un reintento ciego ahí podría reservar dos veces o duplicar el pedido. Por eso, en vez de depender de idempotencia, usamos orquestación con compensación explícita — el patrón Saga, que viene más adelante. No es 'todo idempotente': es una decisión puntual, donde el costo de repetir la operación es cero."

## 5. Escalabilidad — 1:00
"Me preguntaron qué haríamos primero si esto tuviera más carga real. No es 'agregar réplicas al azar' — el motor de descuentos es stateless y CPU-bound, así que escala solo con HPA. El cuello de botella real sería la única instancia de Postgres compartida por los 6 schemas: ahí primero un pooler dedicado tipo PgBouncer, después cache de catálogo en Redis para no pegarle a la base en cada carga del listado. Recién en cuarto lugar cambiaríamos Redis Pub/Sub por un broker durable como RabbitMQ, si el volumen de notificaciones lo justifica."

## 6. Microservicios vs monolito — 1:00
"¿Por qué microservicios y no un monolito modular? Con módulos en un mismo proceso, el checkout cabría en una sola transacción SQL y parecería más simple — pero el patrón Saga sería un ejercicio teórico, no código real, y un solo bug de memoria podría tumbar catálogo, cupones y checkout juntos. Con servicios separados, el aislamiento del motor de descuentos es de proceso, no de carpeta, cada servicio escala y se despliega independiente en GKE, y un fallo en notificaciones nunca bloquea una compra."

## 7. React vs Angular — 1:00
"En el frontend elegimos React 19 con Vite y Zustand para el estado del carrito, en vez de Angular. La razón central: el límite real de responsabilidad de este proyecto está en los 6 microservicios, no en el framework de UI. Angular con RxJS e inyección de dependencias es sobre-ingeniería para un carrito y 3 vistas de admin — React con un store minimalista alcanza, con Vite dándonos HMR instantáneo mientras iterábamos la UI contra un contrato de API ya congelado."

## 8. Por qué NestJS — 45 seg
"En el backend, NestJS en vez de Express plano, porque con 6 procesos independientes la convención importa más que la libertad. NestJS impone la misma forma — módulo, controller, service, guard — en los 6 servicios, así que cualquiera de los desarrolladores puede entrar a cualquiera sin re-aprender su estructura. Además, Swagger se genera del mismo código, nunca se desincroniza."

## 9. Patrón Saga — 1:00
"El checkout de confirmación se orquesta con el patrón Saga: reservar stock, resolver el cupón, calcular el descuento, persistir la orden — cuatro pasos, en ese orden, decididos por order-service. Elegimos orquestación y no coreografía porque el flujo es lineal: una cadena de eventos sería más difícil de seguir para el mismo resultado. Y si algo falla después de reservar el stock, releaseStock() compensa explícitamente — mismo espíritu que la idempotencia: nunca dejar el sistema en un estado a medias."

## 10. Despliegue en GKE — 1:00
[Mostrar el diagrama de despliegue de esta slide como el UML de arquitectura pedido]
"Así se ve desplegado en Kubernetes real: cada microservicio es su propio Deployment con Service ClusterIP — solo el frontend es LoadBalancer, el resto no se expone a Internet. El clúster vivo corre con namespace `ecommerce` en GCP, y la autenticación del pipeline hacia GCP es sin llaves, vía Workload Identity Federation."

## 11. Outbox + Redis — 1:00
"Para eventos asíncronos usamos el patrón Outbox transaccional más Redis Pub/Sub, en vez de RabbitMQ. La orden y su evento se persisten en la MISMA transacción; un proceso OutboxRelay hace poll cada 2 segundos y publica a Redis. Elegimos Redis porque ya lo teníamos para cache, y un broker durable es infraestructura extra para el volumen que manejamos hoy — pero el publicador está detrás de una interfaz, EventPublisher, así que migrar a RabbitMQ el día de mañana no toca la Saga."

## 12. Testing y cobertura — 45 seg
"En cobertura, discount-service —el núcleo del examen— tiene 98%, con tests que verifican no solo el total final sino que las 3 líneas del desglose sumen exacto tras el tope del 35%. order-service y api-gateway están al 100%. En total son más de 220 tests entre los 6 servicios."

## 13. Patrones de diseño — 45 seg
"El enunciado pide un mínimo de 2 patrones de diseño — implementamos 6, todos con código real: Strategy para las reglas de descuento, Factory para armar el pipeline, Saga para el checkout, Repository sobre Prisma, Adapter para poder cambiar de proveedor de identidad o de broker, y Observer en cómo notification-service se suscribe a los eventos de orden."

## 14. CI/CD — 45 seg
"El pipeline en GitHub Actions corre lint, build, y un gate de cobertura del 80% que bloquea el pipeline ANTES de construir ninguna imagen — no se despliega código sin sus pruebas. Acabamos de sumar análisis de SonarCloud al mismo paso. Y la autenticación hacia GCP es sin llaves de larga vida: Workload Identity Federation le da credenciales temporales a cada corrida."

## 15. Estado actual — 1:00
"Para cerrar: esto no es una maqueta. Son 6 microservicios reales corriendo en GKE ahora mismo, Postgres real en Supabase con triggers de auditoría activos sobre datos reales, el frontend completo con catálogo, carrito, checkout y panel admin, login demo y Google OAuth funcionando en paralelo, y un CI/CD que construye, prueba y despliega solo en cada push a main. Lo pendiente y declarado: Row-Level Security en Supabase, HPA multi-réplica, y conectar el JWT real de Google a las rutas del checkout. Gracias — quedo abierto a preguntas."

---

## Cosas para hablar SIN slide dedicada (si hay tiempo o preguntas)
- **Preview vs Confirm**: mismo motor de descuentos, preview nunca toca order-service porque no hay nada que persistir.
- **Vigencia de cupones**: WELCOME2026 es obligatorio y fijo; los cupones de admin (TECH30, JUGUETES10) tienen alcance por categoría.
- **Canje único de cupón** (fix reciente): un mismo cliente no puede reusar el mismo cupón en dos órdenes confirmadas — se verificó contra `customerEmail + couponCode` en order-service.
- **Auditoría con HMAC**: una sola tabla de auditoría ofuscada, trigger genérico, firma HMAC para detectar manipulación posterior — no el nombre ofuscado, que es solo cosmético.
- **JWE vs JWT**: el JWT de sesión no se cifra (viaja por HTTPS); sí se cifra con JWE el bloque de datos del checkout de invitado en reposo.

## Si te preguntan algo que no cubriste
"Buena pregunta — está diseñado a nivel Enterprise pero no lo levantamos para esta entrega, por el mismo criterio de MVP vs Enterprise que mencioné al principio: priorizamos demostrar el motor de descuentos y la Saga con código real, no infraestructura que no se ejercita en la demo."
