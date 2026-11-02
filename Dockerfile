FROM node:22.14.0-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl lsof \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --global pnpm@9.14.4

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml .npmrc ./
COPY patches ./patches

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts

FROM dependencies AS build

COPY . .

RUN pnpm run generate \
  && pnpm snaplet-seed generate

ARG VERSION
ENV VERSION="${VERSION}"

RUN pnpm run build

FROM base AS runtime

ENV NODE_ENV="production"
ENV PORT="7777"
ENV HOME="/tmp"

COPY --chown=1001:0 --from=build /app/build ./build
COPY --chown=1001:0 --from=build /app/node_modules ./node_modules
COPY --chown=1001:0 --from=build /app/package.json ./package.json
COPY --chown=1001:0 --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=1001:0 --from=build /app/prod ./prod
COPY --chown=1001:0 --from=build /app/src ./src
COPY --chown=1001:0 --from=build /app/project.inlang ./project.inlang
COPY --chown=1001:0 --from=build /app/svelte.config.js ./svelte.config.js
COPY --chown=1001:0 --from=build /app/tsconfig.json ./tsconfig.json
COPY --chown=1001:0 --from=build /app/vite.config.ts ./vite.config.ts

# needed for pnpm seed to work
RUN mkdir --parents /app/node_modules/.vite /app/node_modules/.vite-temp /app/.svelte-kit \
  && chown 1001:0 /app/node_modules/.vite /app/node_modules/.vite-temp /app/.svelte-kit \
  && chmod 770 /app/node_modules/.vite /app/node_modules/.vite-temp /app/.svelte-kit \
  && chmod g+rwx /app/src/translations \
  && find /app/src/translations/paraglide -type d -exec chmod g+rwx {} +

USER 1001:0

EXPOSE 7777

CMD ["node", "./prod/server.js"]
