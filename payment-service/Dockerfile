FROM node:18-alpine

# Create non-root user for security
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs -u 1001

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy app and change ownership
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

EXPOSE 3005

CMD ["npm", "start"]
