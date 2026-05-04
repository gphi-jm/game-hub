# Build the Vite client, then serve static files only (no backend).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 8080
ENV PORT=8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
