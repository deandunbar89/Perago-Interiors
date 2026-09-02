import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Uploads submit every selected file in one Server Action call (documents, PM files,
    // vendor docs, snag photos), and each file can be up to 100MB — Next's 1MB default
    // was rejecting any upload over that with a generic "server error".
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
