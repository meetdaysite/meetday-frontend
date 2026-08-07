import type { NextConfig } from "next"

const svgrOptions = {
	replaceAttrValues: { "#000000": "currentColor", "#000": "currentColor", "#111111": "currentColor" },
	svgoConfig: {
		plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false } } }],
	},
	titleProp: true,
}

const nextConfig: NextConfig = {
	output: "standalone",
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	webpack(config: any) {
		const fileLoaderRule = config.module?.rules?.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(rule: any) => rule.test instanceof RegExp && rule.test.test(".svg"),
		)
		if (fileLoaderRule) fileLoaderRule.resourceQuery = { not: [/\?url/] }
		config.module?.rules?.push({
			test: /\.svg$/,
			issuer: /\.[jt]sx?$/,
			resourceQuery: { not: [/\?url/] },
			use: [{ loader: "@svgr/webpack", options: svgrOptions }],
		})
		return config
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "*.s3.ap-south-1.amazonaws.com",
			},
		],
	},
	turbopack: {
		rules: {
			"*.svg": {
				loaders: [{ loader: "@svgr/webpack", options: svgrOptions }],
				as: "*.js",
			},
		},
	},
	async rewrites() {
		return [
			{
				source: "/api/v1/:path*",
				destination: "https://meetday-backend-371293689986.asia-south1.run.app/api/v1/:path*",
			},
		]
	},
}

export default nextConfig
