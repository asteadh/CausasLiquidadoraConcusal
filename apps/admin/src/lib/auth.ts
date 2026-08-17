import { prisma } from "@workspace/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";

// Password plus the optional Google provider, account linking, two-factor auth
// (TOTP + backup codes) and account deletion. Nexulex's own
// packages/auth/src/server.ts additionally wires passkeys and a
// canonical-superadmin bootstrap — not needed for this single-tenant admin
// panel, so this stays smaller than that reference. There is no email
// provider configured anywhere in this repo, so email verification / change
// flows stay disabled rather than silently failing to send.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  plugins: [
    twoFactor({
      issuer: "Causas Liquidadora Concursal",
    }),
  ],
});
