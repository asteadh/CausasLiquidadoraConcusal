"use client";

import { listAccounts } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

export function useHasPassword() {
  const { data, isPending } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const result = await listAccounts();
      return result.data ?? [];
    },
  });

  return {
    hasPassword: data?.some((account) => account.providerId === "credential") ?? false,
    isPending,
  };
}
