# =============================================================================
# The console. Built to static files and served by nginx — there is no Node
# process in production.
#
# Build context is frontend/:  docker build -f frontend/Dockerfile frontend/
#
# NOTE on environment: every VITE_-prefixed variable is inlined into the bundle
# AT BUILD TIME and served to every visitor. That means two things:
#   - the image is environment-specific; you cannot promote a staging image to
#     production and change the API URL with an env var
#   - nothing secret may ever be passed as a build arg here
# =============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci


FROM deps AS build
WORKDIR /app
COPY . .

# Public configuration only. If you find yourself wanting to pass a key here,
# the answer is a backend endpoint that holds it.
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_APP_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_ENV=$VITE_APP_ENV

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
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
