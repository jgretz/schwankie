# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.13.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NestJS/Prisma"

# NestJS/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential openssl 

# Install node modules
COPY --link package.json package-lock.json ./
RUN npm ci --include=dev

# Copy application code
COPY --link . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/prisma ./prisma

# Install production node_modules
RUN npm ci --production

# Generate Prisma Client
RUN npx prisma generate

# Start the server by default, this can be overwritten at runtime
EXPOSE 3001
CMD [ "npm", "run", "start:prod" ]
