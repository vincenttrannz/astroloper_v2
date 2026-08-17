/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by frontend/docker/Dockerfile (multi-stage prod build).
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Wagtail serves images from /media/... on the same origin, so no
    // additional remotePatterns are required in the default local setup.
    // Add S3/CDN hosts here when you migrate media off the docker volume.
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["astroloper.localhost", "localhost:3000"],
    },
  },
};

export default nextConfig;
