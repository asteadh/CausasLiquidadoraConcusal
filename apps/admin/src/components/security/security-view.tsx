"use client";

import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { ConnectedAccounts } from "@/components/security/connected-accounts";
import { DeleteAccountForm } from "@/components/security/delete-account-form";
import { ExtraSecurity } from "@/components/security/extra-security";
import { PasswordForm } from "@/components/security/password-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface SecurityViewProps {
  twoFactorEnabled: boolean;
}

export function SecurityView({ twoFactorEnabled }: SecurityViewProps) {
  const queryClient = useQueryClient();
  const [isEnabled, setIsEnabled] = useState(twoFactorEnabled);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Seguridad</h1>
        <p className="text-muted-foreground text-sm">
          Administra la seguridad de tu cuenta y la autenticación en dos pasos.
        </p>
      </div>

      <PasswordForm
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["accounts"] })}
      />

      <ConnectedAccounts />

      <TwoFactorSetup isEnabled={isEnabled} onStatusChange={setIsEnabled} />

      <ExtraSecurity />

      <DeleteAccountForm />
    </section>
  );
}
