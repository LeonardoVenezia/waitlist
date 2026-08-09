import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/showcase",
        destination: "/",
        permanent: true,
      },
      {
        source: "/showcase/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
