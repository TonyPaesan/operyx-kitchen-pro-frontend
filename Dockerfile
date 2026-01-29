# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy ONLY dependency manifests
COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN npm install

# Copy ONLY source files (NOT node_modules)
COPY src ./src
COPY index.html .
COPY vite.config.ts .
COPY tsconfig.json .

RUN npm run build


# ---------- Serve stage ----------
FROM nginx:alpine

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx template (THIS IS CRITICAL)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# ❌ DO NOT expose ports
# ❌ DO NOT override CMD
# Let nginx's default entrypoint handle $PORT + envsubst
