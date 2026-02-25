/** @type {import("next").NextConfig} */
const nextConfig = {
  basePath: "/mcc",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
