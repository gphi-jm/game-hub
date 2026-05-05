# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Install serve to host the static build
RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# FIX for Windows users: 
# 1. sed: Converts Windows (CRLF) line endings to Linux (LF)
# 2. chmod: Ensures the script has execution permissions in the Linux container
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

ENV PORT=8080
EXPOSE 8080

# Cloud Run: set API_URL or VITE_API_BASE_URL on the service 
# (assumes your script handles writing these to env-config.js)

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]