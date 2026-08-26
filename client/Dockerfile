# Stage 1: Build the Angular application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including devDependencies for angular CLI build)
RUN npm install

# Copy source code files
COPY . .

# Build application
RUN npm run build

# Stage 2: Serve application with Nginx
FROM nginx:alpine

# Copy built browser files to Nginx html directory
COPY --from=builder /app/dist/angular-sso-boilerplate/browser /usr/share/nginx/html

# Copy default conf to allow SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
