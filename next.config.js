const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  }
};

module.exports = nextConfig;
