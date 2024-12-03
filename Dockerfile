# Builder Stage
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install curl
# apt-get install -y curl
RUN apk add --no-cache curl

# Install server dependencies
COPY package*.json .
RUN npm ci

# Build server and client
COPY / .
RUN npm run build

# Final Stage
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy necessary files
COPY --from=builder /usr/src/app .

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
CMD ["npm", "run", "start"]


