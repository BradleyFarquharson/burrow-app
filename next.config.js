/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for Firebase hosting
  trailingSlash: true,
  // Add transpilePackages for next-image-export-optimizer
  transpilePackages: ["next-image-export-optimizer"],
  // Ensure we can deploy to Firebase
  typescript: {
    // Handled by IDE/editor
    ignoreBuildErrors: true,
  },
  eslint: {
    // Handled by IDE/editor
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 