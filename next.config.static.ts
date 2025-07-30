/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Static export için (PHP hosting)
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // API routes'ları devre dışı bırak (static export'ta çalışmaz)
  experimental: {
    missingSuspenseWithCSRBailout: false,
  }
};

module.exports = nextConfig;
