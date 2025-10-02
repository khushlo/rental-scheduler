#!/bin/bash

# Migration script for production deployment
echo "Running database migrations for production..."

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed the database (remove if not needed in production)
# npx prisma db seed

echo "Migration completed!"