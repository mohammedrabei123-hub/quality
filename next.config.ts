import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // صور الـ avatars لو استخدمناها بعدين
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
};

export default nextConfig;
