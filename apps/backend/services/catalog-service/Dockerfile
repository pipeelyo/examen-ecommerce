FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=catalog
ENV DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=catalog
COPY package.json ./
RUN npm install
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
EXPOSE 3002
CMD ["node", "dist/main.js"]
