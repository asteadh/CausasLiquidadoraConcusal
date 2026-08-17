"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { revokeOtherSessions } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExtraSecurity() {
  const [showDialog, setShowDialog] = useState(false);

  const revokeAllMutation = useMutation({
    mutationFn: async () => revokeOtherSessions(),
    onSuccess: () => {
      toast.success("Se cerró la sesión en todos los demás dispositivos");
      setShowDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudieron cerrar las sesiones");
    },
  });

  return (
    <>
      <Card id="extra-security" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad adicional
          </CardTitle>
          <CardDescription>
            Medidas de seguridad adicionales para proteger tu cuenta de accesos no autorizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>¿Cuenta comprometida?</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Si sospechas que alguien más accedió a tu cuenta, puedes cerrar sesión de
                inmediato en todos los dispositivos excepto este. Esto exigirá volver a
                autenticarse en los demás dispositivos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(true)}
                disabled={revokeAllMutation.isPending}
              >
                {revokeAllMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Cerrar sesión en otros dispositivos
              </Button>
            </AlertDescription>
          </Alert>

          <Alert>
            <Shield className="h-5 w-5" />
            <AlertTitle>Consejos de seguridad</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                <li>Activa la autenticación en dos pasos para mayor protección</li>
                <li>Usa una contraseña fuerte y única para tu cuenta</li>
                <li>Revisa periódicamente tus sesiones activas en Actividad</li>
                <li>Nunca compartas tu contraseña o tus códigos 2FA con nadie</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              ¿Cerrar sesión en todos los demás dispositivos?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                Esto finalizará inmediatamente todas las sesiones activas en otros dispositivos y
                navegadores. Permanecerás conectado en este dispositivo.
              </span>
              <span className="block font-semibold">
                Esta acción no se puede deshacer. Los demás dispositivos deberán iniciar sesión de
                nuevo.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={revokeAllMutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
            >
              {revokeAllMutation.isPending && <Loader2 className="animate-spin" />}
              {revokeAllMutation.isPending ? "Cerrando sesiones..." : "Sí, cerrar en otros dispositivos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
