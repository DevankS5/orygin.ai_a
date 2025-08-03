import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  // Ensure proper output for Netlify deployment
  output: 'standalone'
};

export default nextConfig;
