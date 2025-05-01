/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is to handle the canvas module issue with Konva
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
        // Make sure Konva uses the browser version
        'konva': 'konva/lib/index-react',
      }
    }
    
    return config
  },
  // Ensure we're not using server components for files that use Konva
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
