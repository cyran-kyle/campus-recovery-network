FROM node:22-alpine

RUN apk add --no-cache curl postgresql-client libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose application port
EXPOSE 3000

# Push schema, run seed, and start dev server
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm run start:dev"]
