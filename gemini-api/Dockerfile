# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY .env.example .env

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 3000
CMD ["node", "dist/index.js"]