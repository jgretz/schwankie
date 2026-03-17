ARG BUN_VERSION=1.3.10
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

WORKDIR /app
ENV NODE_ENV="production"

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

FROM base AS build

COPY --link package.json tsconfig.json ./
COPY --link packages ./packages
COPY --link apps/www ./apps/www

RUN if [ -f ./apps/www/.env ]; then rm ./apps/www/.env; fi
RUN if [ -f ./apps/www/.env.production ]; then mv ./apps/www/.env.production ./apps/www/.env; fi

RUN bun install

RUN cd apps/www && bun run build

FROM base

COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/packages /app/packages
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/www/node_modules /app/apps/www/node_modules
COPY --from=build /app/apps/www/package.json /app/apps/www/package.json
COPY --from=build /app/apps/www/server.ts /app/apps/www/server.ts
COPY --from=build /app/apps/www/dist /app/apps/www/dist

WORKDIR /app/apps/www

EXPOSE 3000
CMD ["bun", "run", "start"]
