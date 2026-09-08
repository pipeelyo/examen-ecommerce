# GKE Autopilot is linux/amd64: docker build --platform linux/amd64
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/services/discount-service/package.json apps/backend/services/discount-service/package.json
RUN npm ci
COPY apps/backend/services/discount-service apps/backend/services/discount-service
RUN npm run build -w discount-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package.json package-lock.json ./
COPY apps/backend/services/discount-service/package.json apps/backend/services/discount-service/package.json
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/services/discount-service/dist apps/backend/services/discount-service/dist
WORKDIR /app/apps/backend/services/discount-service
EXPOSE 3001
CMD ["node", "dist/main.js"]
