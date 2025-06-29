/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  experimental: {
    // App directory is no longer experimental in Next.js 14
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url" }
        ],
      },
    ];
  },
  webpack: (config) => {
    config.devtool = 'source-map';
    return config;
  },
  serverRuntimeConfig: {
    bodyParser: {
      sizeLimit: '2mb',
    },
    api: {
      bodyParser: {
        sizeLimit: '2mb',
      },
      responseLimit: '16mb',
    },
  },
  publicRuntimeConfig: {
    apiTimeout: 300000,
  },
  api: {
    responseLimit: '16mb',
    bodyParser: {
      sizeLimit: '2mb',
    },
    externalResolver: true,
    timeout: 300000,
  },
  httpAgentOptions: {
    keepAlive: true,
    timeout: 300000,
    rejectUnauthorized: process.env.NODE_ENV !== 'development'
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false,
  generateBuildId: async () => 'build',
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
}

module.exports = nextConfig