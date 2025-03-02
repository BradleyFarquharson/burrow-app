const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Create a next.config.js file with environment variables
const nextConfig = `
module.exports = {
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: "${process.env.NEXT_PUBLIC_GEMINI_API_KEY}",
  },
};
`;

// Write the config file
fs.writeFileSync(path.join(__dirname, '../next.config.js'), nextConfig);

console.log('Environment variables set for deployment'); 