# Multi-stage build for Next.js frontend with production optimization
# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies using BuildKit secret for GitHub token
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
      echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github_token)" > .npmrc; \
    fi && \
    npm ci --omit=dev && \
    rm -f .npmrc

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies using BuildKit secret for GitHub token
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
      echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github_token)" > .npmrc; \
    fi && \
    npm ci && \
    rm -f .npmrc

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
