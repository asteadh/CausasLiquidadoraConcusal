import { prisma } from "@workspace/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Minimal Better Auth setup: email+password only. Nexulex's own
// packages/auth/src/server.ts additionally wires passkeys, two-factor auth,
// social account linking and a canonical-superadmin bootstrap — none of
// which this single-tenant admin panel needs, so this stays intentionally
// small rather than importing that complexity.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
});
