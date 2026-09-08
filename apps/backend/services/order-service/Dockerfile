FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/services/order-service/package.json apps/backend/services/order-service/package.json
COPY apps/backend/services/order-service/prisma apps/backend/services/order-service/prisma
RUN npm ci
COPY apps/backend/services/order-service apps/backend/services/order-service
RUN npm run build -w order-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3004
COPY package.json package-lock.json ./
COPY apps/backend/services/order-service/package.json apps/backend/services/order-service/package.json
COPY apps/backend/services/order-service/prisma apps/backend/services/order-service/prisma
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/services/order-service/dist apps/backend/services/order-service/dist
WORKDIR /app/apps/backend/services/order-service
EXPOSE 3004
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/main.js"]
