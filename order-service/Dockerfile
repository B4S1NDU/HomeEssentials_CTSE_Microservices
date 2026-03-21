# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3004

# Use dumb-init to run the app
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
