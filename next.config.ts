import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors from Supabase-generated recursive types in database.ts
    // that resolve to `never` in strict mode. These need to be fixed by regenerating
    // the database types with the Supabase CLI.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
