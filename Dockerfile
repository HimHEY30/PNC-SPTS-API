# Dockerfile

# ─────────────────────────────────────────
# Stage 1: Base
# ─────────────────────────────────────────
FROM node:20-bullseye-slim AS base

# Set working directory
WORKDIR /usr/src/app

# Ensure OpenSSL (libssl) is available for Prisma native engines
RUN apt-get update -y && \
	apt-get install -y --no-install-recommends ca-certificates openssl libssl1.1 && \
	rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# ─────────────────────────────────────────
# Stage 2: Development
# ─────────────────────────────────────────
FROM base AS development

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Expose port
EXPOSE 3000

# Start the app in watch mode
CMD ["npm", "run", "start:dev"]

# ─────────────────────────────────────────
# Stage 3: Production Builder
# ─────────────────────────────────────────
FROM base AS builder

# Install all dependencies for building
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Build the app
RUN npm run build

# ─────────────────────────────────────────
# Stage 4: Production
# ─────────────────────────────────────────
FROM node:20-bullseye-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built app from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/src/prisma/schema.prisma ./src/prisma/schema.prisma

EXPOSE 3000

CMD ["node", "dist/main"]
