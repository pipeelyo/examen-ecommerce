FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/services/coupon-service/package.json apps/backend/services/coupon-service/package.json
COPY apps/backend/services/coupon-service/prisma apps/backend/services/coupon-service/prisma
RUN npm ci
COPY apps/backend/services/coupon-service apps/backend/services/coupon-service
RUN npm run build -w coupon-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3003
COPY package.json package-lock.json ./
COPY apps/backend/services/coupon-service/package.json apps/backend/services/coupon-service/package.json
COPY apps/backend/services/coupon-service/prisma apps/backend/services/coupon-service/prisma
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/services/coupon-service/dist apps/backend/services/coupon-service/dist
WORKDIR /app/apps/backend/services/coupon-service
EXPOSE 3003
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/main.js"]
