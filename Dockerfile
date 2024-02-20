# Builder Stage
FROM node:14.15.4-alpine AS builder
WORKDIR /usr/src/app

# Install server dependencies
COPY server/package*.json ./server/
RUN npm --prefix server ci

# Install client dependencies
COPY client/package*.json ./client/
RUN npm --prefix client ci

# Build server and client
COPY server/ ./server/
RUN npm --prefix server run build

COPY client/ ./client/
RUN npm --prefix client run build

# Final Stage
FROM node:14.15.4-alpine
WORKDIR /usr/src/app

# Copy necessary files
COPY --from=builder /usr/src/app/server ./server
COPY --from=builder /usr/src/app/client/build ./server/build/static

# Non-root user
RUN adduser -D appuser
USER appuser

# volume for main JSON db file - appuser home directory
VOLUME /home/appuser/db

# create path to db file
# create db file and change ownership to appuser
RUN mkdir -p /home/appuser/db && echo "{}" > /home/appuser/db/db.json && chown appuser /home/appuser/db/db.json

# env var called db_path to be used in server/index.js
ENV db_path /home/appuser/db/db.json
ENV DEBUG *

# Expose and run
EXPOSE 3001
CMD ["npm", "run", "start", "--prefix", "server"]


