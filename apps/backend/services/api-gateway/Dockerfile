FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/services/api-gateway/package.json apps/backend/services/api-gateway/package.json
RUN npm ci
COPY apps/backend/services/api-gateway apps/backend/services/api-gateway
RUN npm run build -w api-gateway

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json ./
COPY apps/backend/services/api-gateway/package.json apps/backend/services/api-gateway/package.json
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/services/api-gateway/dist apps/backend/services/api-gateway/dist
WORKDIR /app/apps/backend/services/api-gateway
EXPOSE 3000
CMD ["node", "dist/main.js"]
