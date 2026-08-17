"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { useHasPassword } from "@/hooks/use-has-password";
import { deleteUser } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const CONFIRMATION_WORD = "ELIMINAR";

export function DeleteAccountForm() {
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const router = useRouter();
  const { hasPassword, isPending: checkingPassword } = useHasPassword();

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteUser(hasPassword ? { password } : {});
      if (result.error) {
        throw new Error(result.error.message || "No se pudo eliminar la cuenta");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Cuenta eliminada correctamente");
      setShowDialog(false);
      router.push("/login");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo eliminar la cuenta");
    },
  });

  function handleOpenDialog() {
    if (checkingPassword) return;
    setShowDialog(true);
  }

  const isDeleteDisabled =
    deleteAccountMutation.isPending ||
    confirmation !== CONFIRMATION_WORD ||
    (hasPassword && !password);

  return (
    <>
      <Card id="delete-account" className="border-destructive scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Eliminar cuenta
          </CardTitle>
          <CardDescription>
            Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se
            puede deshacer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!checkingPassword && hasPassword === false && (
            <Alert>
              <AlertCircle />
              <AlertTitle>Se requiere contraseña</AlertTitle>
              <AlertDescription>
                Iniciaste sesión con Google y no tienes una contraseña establecida. Primero
                establece una contraseña para poder eliminar tu cuenta.
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href="#set-password">Establecer contraseña</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Esta acción es permanente e irreversible. Todos tus datos, incluyendo tu perfil,
              configuración y cualquier contenido asociado se eliminarán de forma definitiva.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleOpenDialog}
            disabled={checkingPassword || hasPassword === false}
          >
            {checkingPassword ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {checkingPassword ? "Comprobando..." : "Eliminar cuenta"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar cuenta</DialogTitle>
            <DialogDescription>
              Esta acción es permanente. Confirma tu contraseña y escribe {CONFIRMATION_WORD} para
              continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="delete-password">Contraseña</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Escribe {CONFIRMATION_WORD} en mayúsculas para confirmar
              </Label>
              <Input
                id="delete-confirmation"
                placeholder={CONFIRMATION_WORD}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={deleteAccountMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleteDisabled}
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
