# =============================================================================
# The console. Built to static files and served by nginx — no Node in
# production.
#
#   docker build -f frontend/Dockerfile --target prod -t <repo>:web-<sha> frontend/
#
# Build context is frontend/, and frontend/.dockerignore keeps this machine's
# node_modules out of it.
#
# ONE IMAGE RUNS ANYWHERE. It used to take VITE_API_BASE_URL as a build
# argument, which baked an API address into the bundle and made every image
# environment-specific. It never needed to: the console calls the API at its
# own origin (BASE = "/api/v1", src/api/client.ts) and nginx below forwards
# /api/ to the API container. So the same image serves localhost, the VM and
# anything later, and there is nothing to rebuild when an address changes.
#
# Anything VITE_-prefixed is inlined into the bundle and served to every
# visitor, so nothing secret may ever be passed here.
# =============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci


FROM deps AS build
WORKDIR /app
COPY . .
# `npm run build` is `tsc -b && vite build`, so a type error fails the image
# rather than shipping a bundle nobody type-checked.
RUN npm run build


# --- development -------------------------------------------------------------
FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# --- production --------------------------------------------------------------
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Which build is live, without opening a terminal:  GET /version.json
ARG BUILD_VERSION=dev
RUN printf '{"version":"%s"}\n' "$BUILD_VERSION" > /usr/share/nginx/html/version.json
LABEL org.opencontainers.image.title="DataMind360 Console" \
      org.opencontainers.image.version="$BUILD_VERSION" \
      org.opencontainers.image.source="https://github.com/HumanoidPlatform/sourcehub"

EXPOSE 80

# Checks that nginx serves the app itself, not that the API behind it is well —
# the API has its own health check, and one failing service should not take the
# other down with it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO /dev/null http://127.0.0.1/version.json || exit 1

CMD ["nginx", "-g", "daemon off;"]
