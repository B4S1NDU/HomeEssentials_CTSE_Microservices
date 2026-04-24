FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose the API Gateway port
EXPOSE 8080

# Command to run the Gateway
CMD ["node", "server.js"]
