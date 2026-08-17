"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { twoFactor } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function TwoFactorVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = useBackupCode
        ? await twoFactor.verifyBackupCode({ code })
        : await twoFactor.verifyTotp({ code });
      if (result.error) {
        throw new Error(
          result.error.message ||
            (useBackupCode ? "Código de respaldo inválido" : "Código de verificación inválido"),
        );
      }
      return result.data;
    },
    onSuccess: () => {
      router.push(callbackUrl);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo verificar el código");
      setCode("");
    },
  });

  function handleSubmit() {
    if (useBackupCode ? code.length === 0 : code.length !== 6) {
      toast.error(useBackupCode ? "Ingresa tu código de respaldo" : "Ingresa un código de 6 dígitos");
      return;
    }
    verifyMutation.mutate(code);
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="bg-primary/10 mb-2 flex h-12 w-12 items-center justify-center rounded-full">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Verificación en dos pasos</CardTitle>
            <CardDescription>
              {useBackupCode
                ? "Ingresa uno de tus códigos de respaldo para continuar."
                : "Ingresa el código de 6 dígitos de tu app autenticadora."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {useBackupCode ? (
              <div className="space-y-2">
                <Label htmlFor="backup-code">Código de respaldo</Label>
                <Input
                  id="backup-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="xxxxxxxx"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={verifyMutation.isPending || (useBackupCode ? code.length === 0 : code.length !== 6)}
              className="w-full"
            >
              {verifyMutation.isPending && <Loader2 className="animate-spin" />}
              {verifyMutation.isPending ? "Verificando..." : "Verificar"}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode("");
                }}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {useBackupCode ? "Usar código de la app autenticadora" : "Usar un código de respaldo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
