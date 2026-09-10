# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN --mount=type=secret,id=gift_data,env=GIFT_DATA,required=true \
    npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist /app/dist

USER node

EXPOSE 3000
CMD ["serve", "dist", "-l", "3000"]
