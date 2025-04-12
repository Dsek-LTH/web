FROM node:22.14.0-alpine3.21 AS base
RUN apk --no-cache add git
RUN apk --no-cache add openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.12.2
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts --prod=false

RUN pnpm generate

FROM prod-deps AS build

COPY . .
RUN pnpm run build

FROM base AS final
COPY package.json .
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 7777
CMD PORT=7777 NODE_ENV='production' node ./prod/server.js