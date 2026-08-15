"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
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
