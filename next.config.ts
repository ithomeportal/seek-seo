import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old equipment slugs → new MANUS slugs
      { source: '/equipment/belly-dump', destination: '/equipment/belly-dumps', permanent: true },
      { source: '/equipment/sand-hopper', destination: '/equipment/sand-hoppers', permanent: true },
      { source: '/equipment/dryvan', destination: '/equipment/dry-vans', permanent: true },
      { source: '/equipment/flatbed', destination: '/equipment/flatbeds', permanent: true },
      { source: '/equipment/tanker', destination: '/equipment/tanks', permanent: true },
      // Old /services routes
      { source: '/services', destination: '/equipment', permanent: true },
      { source: '/services/:path*', destination: '/equipment/:path*', permanent: true },
      // Removed pages
      { source: '/about', destination: '/', permanent: true },
      { source: '/blog', destination: '/', permanent: true },
      { source: '/blog/:path*', destination: '/', permanent: true },
    ]
  },
};

export default nextConfig;
