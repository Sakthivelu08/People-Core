FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including devDependencies to run build)
RUN npm install

# Copy source code files
COPY . .

# Build typescript project
RUN npm run build

# Expose server port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
