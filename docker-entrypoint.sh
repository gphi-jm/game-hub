#!/bin/sh

# 1. Generate the env-config.js file at runtime
# This allows you to inject API URLs via environment variables 
# without rebuilding the Docker image.
echo "window._env_ = {" > /app/dist/env-config.js
echo "  API_URL: \"${API_URL:-https://api.example.com}\"," >> /app/dist/env-config.js
echo "  VITE_API_BASE_URL: \"${VITE_API_BASE_URL:-https://api.example.com}\"" >> /app/dist/env-config.js
echo "};" >> /app/dist/env-config.js

# 2. Start the serve application
# -s: Single Page Application mode (redirects all requests to index.html)
# -l: Listen on the port defined by the environment
serve -s dist -l ${PORT:-8080}