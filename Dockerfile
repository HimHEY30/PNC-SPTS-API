# Dockerfile for Development

# Use a Node.js base image
FROM node:20-bullseye-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install OpenSSL, which is required by Prisma
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends ca-certificates openssl libssl1.1 && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force && npm install

# Copy the rest of the application's source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Expose the port the app runs on
EXPOSE 3000

# The command to run the application in development mode
CMD ["npm", "run", "start:dev"]

