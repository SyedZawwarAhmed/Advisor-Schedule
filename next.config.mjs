/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle the problematic modules
    config.module.rules.push({
      test: /node_modules[\\\/]clone-deep[\\\/].*\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    });

    // Alias @prisma/client to generated/prisma
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@prisma/client'] = require('path').resolve(__dirname, 'generated/prisma');

    return config;
  },
}

export default nextConfig
