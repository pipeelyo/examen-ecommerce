FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/discount-engine/package.json packages/discount-engine/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci
COPY packages/discount-engine packages/discount-engine
COPY apps/backend apps/backend
RUN npm run build -w @examen/discount-engine && npm run build -w @examen/backend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json ./
COPY packages/discount-engine/package.json packages/discount-engine/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --omit=dev
COPY --from=build /app/packages/discount-engine/dist packages/discount-engine/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
