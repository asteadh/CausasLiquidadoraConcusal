"use client";

import { createAuthClient } from "better-auth/react";

// No baseURL: the admin app serves both the UI and the Better Auth catch-all
// route (src/app/api/auth/[...all]/route.ts) from the same origin, so
// relative requests are sufficient — no extra NEXT_PUBLIC_* env var needed.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
