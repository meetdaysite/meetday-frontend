import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              replaceAttrValues: { "#000000": "currentColor", "#000": "currentColor", "#111111": "currentColor" },
              svgoConfig: {
                plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }],
              },
              titleProp: true,
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
