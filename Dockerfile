##########
# Builder Stage
##########
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Enable corepack and install dependencies with pnpm using the lockfile
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Build server and client
COPY . .
RUN pnpm build
# RUN if [ -f .output/public/_build/sw.js ]; then cp .output/public/_build/sw.js .output/public/sw.js; fi
# RUN if [ -f .output/public/_build/sw.js ]; then cp .output/public/_build/sw.js public/sw.js; fi

##########
# Runner Stage
##########
FROM node:22-alpine AS runner
WORKDIR /usr/src/app

# Install runtime tools
RUN apk add --no-cache curl

ENV NODE_ENV=production

# Enable corepack and install only production dependencies
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# Copy built artifacts and public assets
COPY --from=builder /usr/src/app/.output ./.output
COPY --from=builder /usr/src/app/public ./public

# Remain root inside container (non-root user can be set up later if desired)
USER root

# Volume for main JSON db file - appuser home directory
VOLUME /home/appuser/db

# Create path to db file and initialize empty JSON
RUN mkdir -p /home/appuser/db && echo "{}" > /home/appuser/db/db.json

# Env var used by the app for DB path
ENV db_path=/home/appuser/db/db.json

# Expose and run
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["node", ".output/server/index.mjs"]


