# Builder Stage
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install server dependencies
COPY hn_next/package*.json ./hn_next/
RUN npm --prefix hn_next ci

# Build server and client
COPY hn_next/ ./hn_next/
RUN npm --prefix hn_next run build

# Final Stage
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy necessary files
COPY --from=builder /usr/src/app/hn_next ./hn_next

# Non-root user
USER root

# volume for main JSON db file - appuser home directory
VOLUME /home/appuser/db

# create path to db file
# create db file and change ownership to appuser
RUN mkdir -p /home/appuser/db && echo "{}" > /home/appuser/db/db.json

# env var called db_path to be used in server/index.js
ENV db_path /home/appuser/db/db.json

# Expose and run
EXPOSE 3000
CMD ["npm", "run", "start", "--prefix", "hn_next"]


