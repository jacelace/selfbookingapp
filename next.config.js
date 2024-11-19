/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false,
      };
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: false,
      "fs": false,
      "path": false,
      "os": false,
      "net": false,
      "tls": false,
      "child_process": false,
    };
    return config;
  },
  transpilePackages: ['firebase', '@firebase/auth']
}

module.exports = nextConfig
