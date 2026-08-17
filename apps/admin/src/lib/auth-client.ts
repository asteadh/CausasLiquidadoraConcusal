"use client";

import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authClientOptions = {
  plugins: [
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
  ],
};

type AuthClient = ReturnType<typeof createAuthClient<typeof authClientOptions>>;

// No baseURL: the admin app serves both the UI and the Better Auth catch-all
// route (src/app/api/auth/[...all]/route.ts) from the same origin, so
// relative requests are sufficient — no extra NEXT_PUBLIC_* env var needed.
export const authClient: AuthClient = createAuthClient(authClientOptions);

export const updateUser: AuthClient["updateUser"] = authClient.updateUser;

export const {
  signIn,
  signOut,
  useSession,
  getSession,
  changePassword,
  deleteUser,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  listAccounts,
  linkSocial,
  unlinkAccount,
  twoFactor,
} = authClient;

export type Session = typeof authClient.$Infer.Session;
