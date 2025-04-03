#!/bin/bash

echo "Starting deployment process for Vercel..."

# Build the client application
echo "Building React client..."
cd client && npm run build && cd ..

# Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel --prod

echo "Deployment process completed!" 