import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Only enable PWA in production — dev uses Turbopack which is incompatible
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: import("next").NextConfig = {
  // Silence the Turbopack + webpack config mismatch warning
  turbopack: {},
};

export default withSerwist(nextConfig);


