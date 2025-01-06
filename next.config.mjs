// next.config.mjs
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    experimental: {
    serverActions: true,
    },
    webpack: (config, { isServer }) => {
    // Add this to handle the replicate warning
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    return config;
    },
  /* config options here */
};

export default nextConfig;

