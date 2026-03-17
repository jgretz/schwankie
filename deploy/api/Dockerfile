ARG BUN_VERSION=1.3.10
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

WORKDIR /app
ENV NODE_ENV="production"

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

FROM base AS build

COPY --link bun.lock package.json tsconfig.json ./
COPY --link packages ./packages
COPY --link apps/api ./apps/api

RUN if [ -f ./apps/api/.env ]; then rm ./apps/api/.env; fi
RUN if [ -f ./apps/api/.env.production ]; then mv ./apps/api/.env.production ./apps/api/.env; fi

RUN bun install

FROM base

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/tsconfig.json /app/tsconfig.json
COPY --from=build /app/packages /app/packages
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/src /app/apps/api/src

WORKDIR /app/apps/api

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
