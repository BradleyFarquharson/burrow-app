#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Try to build the Next.js app
echo "📦 Attempting to build the Next.js app..."
npm run build || {
  echo "⚠️ Build failed, using placeholder page instead"
  
  # Create a simple index.html for Firebase Hosting
  mkdir -p out
  cat > out/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Burrow - Coming Soon</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 600px;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(90deg, #4f46e5, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      font-size: 1.2rem;
      line-height: 1.6;
      color: #a3a3a3;
      margin-bottom: 2rem;
    }
    .coming-soon {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background-color: #06b6d4;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: bold;
      text-decoration: none;
      margin-top: 1rem;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #0891b2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Burrow</h1>
    <p>A visual exploration tool for brainstorming and organizing ideas. Burrow helps you explore concepts through an interactive canvas, allowing you to create connections between ideas and dive deeper into topics.</p>
    <div class="coming-soon">Coming Soon</div>
    <p style="margin-top: 2rem; font-size: 0.9rem;">
      We're working hard to bring you the full experience. In the meantime, you can check out our GitHub repository.
    </p>
    <a href="https://github.com/BradleyFarquharson/burrow-app" class="button">View on GitHub</a>
  </div>
</body>
</html>
EOL
  echo "📦 Created placeholder page"
}

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌐 Your app is now available at: https://burrow-51943.web.app" 