# =========================================
# STAGE 1 - BUILD
# =========================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npm run build

# =========================================
# STAGE 2 - PRODUCTION
# =========================================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./

# Install prod deps first, then copy generated client on top
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy prisma schema + migrations (needed for db:migrate at runtime)
COPY --from=builder /app/src/prisma ./src/prisma

# Copy generated Prisma client — must come AFTER npm ci so it isn't wiped
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/main"]