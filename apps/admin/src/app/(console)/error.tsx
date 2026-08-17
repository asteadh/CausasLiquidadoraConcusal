"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Console failed safely", error.digest ?? error.name);
  }, [error]);

  return (
    <Card className="mx-auto mt-16 max-w-xl">
      <CardHeader>
        <AlertTriangle className="text-destructive h-8 w-8" />
        <CardTitle className="pt-2">No se pudo cargar la información</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Ocurrió un error al consultar las causas. La consola cerró de forma segura sin mostrar
          datos incompletos.
        </p>
        <Button onClick={reset}>Volver a intentar</Button>
      </CardContent>
    </Card>
  );
}
