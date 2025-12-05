/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  webpack: (webpackConfig, { webpack, isServer }) => {
    webpackConfig.plugins.push(
      // Remove node: from import specifiers, because Next.js does not yet support node: scheme
      // https://github.com/vercel/next.js/issues/28774
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );

    // Fix for face-api.js - these Node.js modules are not needed in browser
    if (!isServer) {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        encoding: false,
        path: false,
        stream: false,
        crypto: false,
      };
      
      // Alias to ignore encoding module
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        encoding: false,
      };
    }

    // Suppress warnings for face-api.js dependencies
    webpackConfig.ignoreWarnings = [
      { module: /node_modules\/face-api\.js/ },
      { module: /node_modules\/@tensorflow/ },
      { module: /node_modules\/node-fetch/ },
    ];

    return webpackConfig;
  },
};

module.exports = nextConfig;
