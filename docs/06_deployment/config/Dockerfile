# ============================================================================
# Dockerfile for Unicon Schedule Production
# ============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git

# Copy package files
COPY package*.json ./
COPY main.wasp ./

# Copy source code
COPY src ./src
COPY public ./public
COPY .waspignore ./.waspignore

# Install Wasp
RUN curl -sSL https://get.wasp-lang.dev/installer.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Verify Wasp installation
RUN wasp version

# Build the application
RUN wasp build

# ============================================================================
# Production stage
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl

# Copy built application from builder
COPY --from=builder /app/.wasp/build ./

# Install production dependencies
RUN npm ci --only=production

# Create uploads directory structure
RUN mkdir -p public/uploads/debts/invoices && \
    mkdir -p public/uploads/debts/payments && \
    mkdir -p public/uploads/drivers/citizen_id && \
    mkdir -p public/uploads/drivers/license && \
    mkdir -p public/uploads/vehicles/registration && \
    mkdir -p public/uploads/vehicles/inspection && \
    mkdir -p public/uploads/vehicles/insurance

# Set permissions
RUN chmod -R 755 public/uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# Start the application
CMD ["npm", "start"]
