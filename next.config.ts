import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server serve HMR/webpack assets when opened from another
  // device on the LAN (e.g. testing on a phone via http://<lan-ip>:3000).
  allowedDevOrigins: ["192.168.88.53"],
};

export default nextConfig;
