import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ["10.23.131.100", "localhost:3000"]
  }
};

export default nextConfig;
