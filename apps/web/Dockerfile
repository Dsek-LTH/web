FROM node:24.22.2-slim AS base

WORKDIR /app

FROM base AS pnpm

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN npm install --global pnpm@12.16.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches

FROM pnpm AS dependencies

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts

# What the server needs at run time: adapter-node bundles the dev
# dependencies into build/.
FROM pnpm AS production-dependencies

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts --prod

FROM dependencies AS build

COPY . .

# The Go backend's public URL; $env/static/public bakes it in at build time.
ARG PUBLIC_GO_BACKEND_URL
ENV PUBLIC_GO_BACKEND_URL="${PUBLIC_GO_BACKEND_URL}"

ARG PUBLIC_MINIO_BASE_URL
ENV PUBLIC_MINIO_BASE_URL="${PUBLIC_MINIO_BASE_URL}"

ARG PUBLIC_BUCKETS_ALBUMS
ENV PUBLIC_BUCKETS_ALBUMS="${PUBLIC_BUCKETS_ALBUMS}"

ARG PUBLIC_BUCKETS_DOCUMENTS
ENV PUBLIC_BUCKETS_DOCUMENTS="${PUBLIC_BUCKETS_DOCUMENTS}"

ARG PUBLIC_BUCKETS_FILES
ENV PUBLIC_BUCKETS_FILES="${PUBLIC_BUCKETS_FILES}"

ARG PUBLIC_BUCKETS_MEMBERS
ENV PUBLIC_BUCKETS_MEMBERS="${PUBLIC_BUCKETS_MEMBERS}"

ARG VERSION
ENV VERSION="${VERSION}"

RUN pnpm run build

FROM base AS runtime

ENV NODE_ENV="production"
ENV PORT="7777"
ENV HOME="/tmp"

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/build ./build
COPY --from=build /app/prod ./prod

USER 1001:0

EXPOSE 7777

CMD ["node", "./prod/server.js"]
