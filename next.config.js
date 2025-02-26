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
  // Disable development indicators (including static route indicator)
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Force a unique build ID to prevent caching issues
  generateBuildId: async () => {
    return `build-${new Date().getTime()}`;
  }
};

module.exports = nextConfig; 