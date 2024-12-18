# Stage 1: Build dependencies
FROM node:alpine AS builder

WORKDIR /app

RUN apk add --no-cache poppler-utils poppler-data

COPY package.json pnpm-lock.yaml ./
RUN npm install --production

COPY . .

# Stage 2: Final runtime image
FROM node:alpine

WORKDIR /app

RUN apk add --no-cache poppler-utils poppler-data

COPY --from=builder /app /app

EXPOSE 8800

CMD ["node", "index.js"]
