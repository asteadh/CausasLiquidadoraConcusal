"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useHasPassword } from "@/hooks/use-has-password";
import { twoFactor } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2, Shield, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useState } from "react";
import { toast } from "sonner";

type Step = "confirm" | "verify" | "backup";

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange?: (enabled: boolean) => void;
}

export function TwoFactorSetup({ isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("confirm");

  const { hasPassword, isPending: checkingPassword } = useHasPassword();

  const enableMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await twoFactor.enable({ password });
      if (result.error) {
        throw new Error(result.error.message || "No se pudo generar la configuración de 2FA");
      }
      return result.data;
    },
    onSuccess: async (data) => {
      if (data) {
        const qrCodeDataUrl = await QRCode.toDataURL(data.totpURI);
        setQrCode(qrCodeDataUrl);
        setBackupCodes(data.backupCodes ?? []);
        setStep("verify");
        setPassword("");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo activar la autenticación en dos pasos");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await twoFactor.verifyTotp({ code });
      if (result.error) {
        throw new Error(result.error.message || "Código de verificación inválido");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Autenticación en dos pasos activada correctamente");
      setStep("backup");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo verificar el código");
      setTotpCode("");
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await twoFactor.disable({ password });
      if (result.error) {
        throw new Error(result.error.message || "No se pudo desactivar la autenticación en dos pasos");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Autenticación en dos pasos desactivada");
      setShowDisableDialog(false);
      setPassword("");
      onStatusChange?.(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo desactivar la autenticación en dos pasos");
    },
  });

  function handleEnableClick() {
    if (hasPassword === false) {
      toast.error("Primero debes establecer una contraseña", {
        description: "Necesitas una contraseña para poder activar la autenticación en dos pasos.",
      });
      return;
    }
    setShowSetupDialog(true);
  }

  function handleEnable2FA() {
    if (!password) return;
    enableMutation.mutate(password);
  }

  function handleVerify2FA() {
    if (totpCode.length !== 6) {
      toast.error("Ingresa un código de 6 dígitos");
      return;
    }
    verifyMutation.mutate(totpCode);
  }

  function handleDisable2FA() {
    if (!password) return;
    disableMutation.mutate(password);
  }

  function handleComplete() {
    setShowSetupDialog(false);
    setStep("confirm");
    setQrCode("");
    setBackupCodes([]);
    setTotpCode("");
    setPassword("");
    onStatusChange?.(true);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Códigos copiados al portapapeles");
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codigos-de-respaldo.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Card id="two-factor" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            Autenticación en dos pasos
          </CardTitle>
          <CardDescription>
            Agrega una capa adicional de seguridad exigiendo un código de tu app autenticadora al
            iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Activada" : "Desactivada"}
          </Badge>

          {!checkingPassword && hasPassword === false && !isEnabled && (
            <Alert>
              <AlertCircle />
              <AlertTitle>Se requiere contraseña</AlertTitle>
              <AlertDescription>
                Iniciaste sesión con Google y no tienes una contraseña establecida. Primero
                establece una contraseña para poder activar la autenticación en dos pasos.
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href="#set-password">Establecer contraseña</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {isEnabled ? (
            <Button variant="destructive" onClick={() => setShowDisableDialog(true)}>
              Desactivar 2FA
            </Button>
          ) : (
            <Button onClick={handleEnableClick} disabled={checkingPassword || hasPassword === false}>
              {checkingPassword && <Loader2 className="animate-spin" />}
              {checkingPassword ? "Comprobando..." : "Activar 2FA"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="px-2 py-6 sm:max-w-md sm:px-6">
          <DialogHeader className="items-center">
            <DialogTitle>
              {step === "confirm" && "Activar autenticación en dos pasos"}
              {step === "verify" && "Verifica tu código"}
              {step === "backup" && "Guarda tus códigos de respaldo"}
            </DialogTitle>
            <DialogDescription>
              {step === "confirm" &&
                "Ingresa tu contraseña para generar un código QR para tu app autenticadora."}
              {step === "verify" &&
                "Ingresa el código de 6 dígitos de tu app autenticadora para completar la configuración."}
              {step === "backup" &&
                "Guarda estos códigos de respaldo en un lugar seguro. Puedes usarlos para acceder a tu cuenta si pierdes tu dispositivo autenticador."}
            </DialogDescription>
          </DialogHeader>

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enable-password">Contraseña</Label>
                <Input
                  id="enable-password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnable2FA()}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleEnable2FA}
                  disabled={enableMutation.isPending || !password}
                  className="w-full"
                >
                  {enableMutation.isPending && <Loader2 className="animate-spin" />}
                  {enableMutation.isPending ? "Generando..." : "Continuar"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {qrCode && (
                  <div className="flex items-center justify-center rounded-lg bg-white p-4">
                    <Image src={qrCode} alt="Código QR" width={200} height={200} />
                  </div>
                )}
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode}>
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
              </div>
              <DialogFooter>
                <Button
                  onClick={handleVerify2FA}
                  disabled={verifyMutation.isPending || totpCode.length !== 6}
                  className="w-full"
                >
                  {verifyMutation.isPending && <Loader2 className="animate-spin" />}
                  {verifyMutation.isPending ? "Verificando..." : "Verificar"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-4">
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <p className="text-sm font-medium">Tus códigos de respaldo:</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code) => (
                    <div key={code} className="bg-background rounded p-2 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                  Copiar códigos
                </Button>
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  Descargar códigos
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleComplete} className="w-full">
                  Finalizar configuración
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar autenticación en dos pasos</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña para desactivar la autenticación en dos pasos de tu cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Contraseña</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDisable2FA()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={disableMutation.isPending || !password}
              >
                {disableMutation.isPending && <Loader2 className="animate-spin" />}
                {disableMutation.isPending ? "Desactivando..." : "Desactivar 2FA"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
