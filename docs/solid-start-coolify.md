### Hosting a SolidStart app on Coolify with Docker (and why I still used Compose)

I recently moved a SolidStart app to Coolify and wanted the deployment to be fully reproducible with Docker. The plain Dockerfile was enough to build and run the app end‑to‑end in Coolify. However, I switched to a small `docker-compose.yml` so I could explicitly manage a named volume for the app’s lightweight JSON data file and make backups/restores easier. Below is what I used and why.

### Dockerfile: multi‑stage build, small runtime, explicit db path

The Dockerfile uses a builder stage to install dependencies and compile the app, and a runner stage to keep the runtime image small. It also declares a mount path for a simple JSON “db” and sets an environment variable the app reads at runtime.

```dockerfile
# Builder
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

# Runner
FROM node:22-alpine AS runner
WORKDIR /usr/src/app
RUN apk add --no-cache curl
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=builder /usr/src/app/.output ./.output
COPY --from=builder /usr/src/app/public ./public

# Persist app data in /home/appuser/db/db.json
VOLUME /home/appuser/db
RUN mkdir -p /home/appuser/db && echo "{}" > /home/appuser/db/db.json
ENV db_path=/home/appuser/db/db.json

EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["node", ".output/server/index.mjs"]
```

Key points:

- **Multi‑stage build** keeps the runtime smaller and faster to start.
- **`db_path` env var** points the app to a file in a writable volume.
- **`VOLUME /home/appuser/db`** makes persistence possible even without Compose.

In Coolify, deploying straight from this Dockerfile works: Coolify detects the port, builds the image, and runs the container. If you’re okay with an anonymous volume, you can stop here.

### Why I added docker‑compose anyway: durable, named volume control

I wanted a named volume that I could manage explicitly, snapshot, and restore across deployments. That’s where Compose helped. Here’s the minimal `docker-compose.yml` I pointed Coolify to:

```yaml
version: "3.9"

services:
  hn-client:
    build:
      context: .
      dockerfile: Dockerfile
    image: hn-client:latest
    ports:
      - "3000"
    environment:
      - NODE_ENV=production
      - db_path=/home/appuser/db/db.json
    volumes:
      - hnclient-db:/home/appuser/db
    restart: unless-stopped

volumes:
  hnclient-db:
```

With this, Coolify provisions a named volume `hnclient-db` and mounts it to the same location the app expects. Backups and troubleshooting become simpler because the data is not in an anonymous volume.

### Coolify setup (Dockerfile vs Compose)

- **Option A – Dockerfile**: Create an app from a Dockerfile, point to the repo root, and ensure the exposed port is `3000`. Add an environment variable `db_path=/home/appuser/db/db.json`. Optionally configure a volume in Coolify mapped to `/home/appuser/db`.
- **Option B – Compose (my choice)**: Create an app from `docker-compose.yml`. Coolify parses the file, builds the image, and automatically manages the named volume `hnclient-db`.

Image placeholders (replace with your screenshots):

![Coolify: Create app from Dockerfile or Compose](https://placehold.co/1200x630?text=Coolify+Create+App)

![Coolify: Environment variables (db_path) and port 3000](https://placehold.co/1200x630?text=Coolify+Env+%26+Ports)

![Coolify: Volume mapping to /home/appuser/db](https://placehold.co/1200x630?text=Coolify+Volume+Mapping)

### Tips

- **Stick to a single source of truth**: Either set `db_path` in the Dockerfile or override in Compose/Coolify, but avoid accidental drift.
- **Backups**: With a named volume, you can export/import data easily between environments.
- **Zero‑downtime restarts**: Use `restart: unless-stopped` and let Coolify handle health checks.

That’s it. The Dockerfile alone will run fine in Coolify; I added Compose purely to make data persistence explicit and portable via a named volume. If you don’t need that level of control, the Dockerfile-only approach is perfectly sufficient.
