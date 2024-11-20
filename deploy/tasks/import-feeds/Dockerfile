# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.1.33
FROM oven/bun:${BUN_VERSION}-slim as base

LABEL fly_launch_runtime="Bun"

# Bun app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

# Install node modules
COPY bun.lockb package.json ./
RUN bun install --ci

# Copy Files
COPY --link package.json tsconfig.json ./
COPY --link packages ./packages
COPY --link tasks/import-feeds ./tasks/import-feeds

# Install dependencies
RUN bun install --ci

# Build the compiled output
RUN bun build ./tasks/import-feeds/src/index.ts --outdir out --target bun

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/out /app
COPY --from=build /app/node_modules /app/node_modules

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["bun", "run", "index.js"]
