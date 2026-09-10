# syntax=docker/dockerfile:1

# Production dependencies only, kept separate so the runtime layer never
# carries vitest and friends.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# No gift data here on purpose. /gift renders per request, so the children's
# names and codes never enter the build, the image, or the registry -- they are
# supplied at runtime from the Doppler-managed secret.
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "./dist/server/entry.mjs"]
