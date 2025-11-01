# ==============================================================================
# FRONTEND DOCKERFILE
# ==============================================================================
#
# PURPOSE: Builds production-ready Vue.js frontend
#
# MULTI-STAGE BUILD:
# Stage 1 (build): Compiles Vue.js app
# Stage 2 (production): Serves static files with nginx
#
# WHY NGINX:
# - Lightweight HTTP server for static files
# - Better performance than Node.js for serving HTML/CSS/JS
# - Smaller image size
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: BUILD
# ------------------------------------------------------------------------------
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
# WHY separate: Leverages Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build for production
# WHY: Compiles Vue.js to optimized static files
# Output goes to /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: PRODUCTION
# ------------------------------------------------------------------------------
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
# WHY: Configure nginx for single-page application routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
