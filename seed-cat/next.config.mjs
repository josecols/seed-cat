import NextBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const graphEndpoint = process.env.GRAPH_ENDPOINT;
const graphDestination =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:5000'
    : graphEndpoint;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    const rules = [
      {
        source: '/review/:pair/:index',
        destination: '/translate/:pair/:index',
      },
    ];
    if (graphDestination) {
      rules.push({
        source: '/graph/:path*',
        destination: `${graphDestination.replace(/\/$/, '')}/:path*`,
      });
    }
    return rules;
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
