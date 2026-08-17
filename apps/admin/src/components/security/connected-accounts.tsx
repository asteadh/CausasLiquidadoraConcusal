"use client";

import { GoogleMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasPassword } from "@/hooks/use-has-password";
import { authClient, listAccounts, unlinkAccount } from "@/lib/auth-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ConnectedAccounts() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const { hasPassword } = useHasPassword();

  const { data: accounts, isPending } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const result = await listAccounts();
      return result.data ?? [];
    },
  });

  const isConnected = accounts?.some((account) => account.providerId === "google") ?? false;
  const canDisconnect = hasPassword || (accounts?.length ?? 0) > 1;

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await unlinkAccount({ providerId: "google" });
      if (error) {
        throw new Error(error.message || "No se pudo desconectar la cuenta");
      }
    },
    onSuccess: () => {
      toast.success("Cuenta de Google desconectada");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo desconectar la cuenta");
    },
  });

  async function handleConnect() {
    setIsConnecting(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/settings/security",
      });
      if (error) {
        throw new Error(error.message || "No se pudo iniciar la conexión");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar la conexión";
      toast.error(message);
      setIsConnecting(false);
    }
  }

  if (isPending) {
    return <ConnectedAccountsSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas conectadas</CardTitle>
        <CardDescription>
          Administra los proveedores externos vinculados a tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <span className="bg-muted flex h-8 w-8 items-center justify-center rounded-full border">
              <GoogleMark />
            </span>
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-muted-foreground text-sm">
                {isConnected ? "Conectada" : "No conectada"}
              </p>
            </div>
          </div>
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending || !canDisconnect}
            >
              {unlinkMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
              Desconectar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? <Loader2 className="animate-spin" /> : <Link2 className="h-4 w-4" />}
              Conectar
            </Button>
          )}
        </div>

        <Separator />
        <p className="text-muted-foreground text-sm">
          Necesitas al menos un método de acceso activo. Agrega una contraseña antes de
          desconectar tu única cuenta vinculada.
        </p>
      </CardContent>
    </Card>
  );
}

export function ConnectedAccountsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
