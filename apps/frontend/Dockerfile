FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/discount-engine/package.json packages/discount-engine/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci
COPY packages/discount-engine packages/discount-engine
COPY apps/frontend apps/frontend
RUN npm run build -w @examen/frontend

FROM nginx:1.27-alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
