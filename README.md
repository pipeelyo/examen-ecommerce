# examen-ecommerce

MVP de checkout con descuentos acumulativos (prueba técnica Full Stack).

Repo público: https://github.com/pipeelyo/examen-ecommerce

## Estructura

```
examen-ecommerce/
├── apps/backend/              # NestJS
├── apps/frontend/             # React + Vite
├── packages/discount-engine/  # cascada de descuentos
├── k8s/gke.yaml               # GKE Autopilot (sin Redis/RabbitMQ)
├── docs/sdd.md
├── docs/arquitectura.md
└── docs/ia.md
```

## Local

Node.js ≥ 20.

```bash
npm install
npm test
npm run test:coverage
npm run dev:backend   # http://127.0.0.1:3000/api/docs
npm run dev:frontend  # http://127.0.0.1:5173
```

Cupón de demo: `WELCOME2026`.

## GCP

Proyecto `round-seeker-309101`, región `us-central1`.

- Artifact Registry: `ecommerce`
- Cluster Autopilot: `ecommerce`
- Namespace: `ecommerce`
- CD: GitHub Actions + Workload Identity Federation (`github-deploy`)

Push a `main` construye imágenes `backend`/`frontend` y hace rollout. El Service `frontend` es LoadBalancer; nginx reenvía `/api/` al backend.
