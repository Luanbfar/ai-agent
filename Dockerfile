# Base stage
FROM node:22-alpine AS base
WORKDIR /app
COPY api/package*.json ./

# Dependencies
FROM base AS deps
RUN npm ci --omit=optional

# Build stage
FROM deps AS build
COPY api/src ./src
COPY api/tsconfig.json ./
COPY api/tools ./tools
RUN npm run build

# Test stage
FROM deps AS test
COPY api/src ./src
COPY api/tests ./tests
COPY api/tsconfig.json ./
COPY api/jest.e2e.config.js ./
COPY api/.env .env
CMD ["npm", "test"]

# Development stage
FROM deps AS dev
COPY api/src ./src
COPY api/tsconfig.json ./
COPY api/.env .env
RUN npm install -g tsx
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
FROM node:22-alpine AS prod
WORKDIR /app

# Install only production dependencies
COPY api/package*.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

# Copy built application
COPY --from=build /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

EXPOSE 3000
CMD ["node", "dist/index.js"]