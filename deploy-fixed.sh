#!/bin/bash

echo "Starting enhanced deployment process for Vercel..."

# Create a clean deployment directory
rm -rf .vercel-deploy
mkdir -p .vercel-deploy/api
mkdir -p .vercel-deploy/data

# Copy API files
echo "Copying API files..."
cp api/index.js .vercel-deploy/api/
cp api/csv-reader.js .vercel-deploy/api/
cp api/package.json .vercel-deploy/api/

# Copy data files
echo "Copying data files..."
cp data/*.csv .vercel-deploy/data/

# Copy client build
echo "Building React client..."
cd client && npm run build
cd ..
mkdir -p .vercel-deploy/client
cp -r client/build/* .vercel-deploy/client/

# Copy vercel.json
echo "Setting up Vercel configuration..."
cp vercel.json .vercel-deploy/

# Go to deployment directory and deploy
echo "Deploying to Vercel..."
cd .vercel-deploy
npx vercel --prod

echo "Deployment process completed!" 