"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export function SignOutButton({ className }: Pick<ComponentProps<typeof Button>, "className">) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm" className={className}
      onClick={async () => {
        await signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Cerrar sesión
    </Button>
  );
}
