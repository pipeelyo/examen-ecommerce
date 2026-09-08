FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/services/notification-service/package.json apps/backend/services/notification-service/package.json
RUN npm ci
COPY apps/backend/services/notification-service apps/backend/services/notification-service
RUN npm run build -w notification-service

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3005
COPY package.json package-lock.json ./
COPY apps/backend/services/notification-service/package.json apps/backend/services/notification-service/package.json
RUN npm ci --omit=dev
COPY --from=build /app/apps/backend/services/notification-service/dist apps/backend/services/notification-service/dist
WORKDIR /app/apps/backend/services/notification-service
EXPOSE 3005
CMD ["node", "dist/main.js"]
