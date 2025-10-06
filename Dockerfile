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
ARG PUBLIC_MINIO_ENDPOINT
ENV PUBLIC_MINIO_ENDPOINT ${PUBLIC_MINIO_ENDPOINT}

ARG PUBLIC_MINIO_PORT
ENV PUBLIC_MINIO_PORT ${PUBLIC_MINIO_PORT}

ARG PUBLIC_MINIO_USE_SSL
ENV PUBLIC_MINIO_USE_SSL ${PUBLIC_MINIO_USE_SSL}

ARG PUBLIC_BUCKETS_DOCUMENTS
ENV PUBLIC_BUCKETS_DOCUMENTS ${PUBLIC_BUCKETS_DOCUMENTS}

ARG PUBLIC_BUCKETS_FILES
ENV PUBLIC_BUCKETS_FILES ${PUBLIC_BUCKETS_FILES}

ARG PUBLIC_BUCKETS_MEMBERS
ENV PUBLIC_BUCKETS_MEMBERS ${PUBLIC_BUCKETS_MEMBERS}

ARG VERSION
ENV VERSION ${VERSION}

COPY . .
RUN --mount=type=secret pnpm run build

FROM base AS final
COPY package.json .
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 7777
CMD PORT=7777 NODE_ENV='production' node ./prod/server.js