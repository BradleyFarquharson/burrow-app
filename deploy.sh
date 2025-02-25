#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "$1" == "--fresh" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the Next.js application
echo "🔨 Building the application..."
npm run build

# Export the static site
echo "📤 Exporting static site..."
# This step is handled by the build command with the next.config.js output: 'export' setting

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌐 Your app is now available at: https://burrow-51943.web.app" 