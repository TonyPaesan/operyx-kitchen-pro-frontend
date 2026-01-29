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

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
