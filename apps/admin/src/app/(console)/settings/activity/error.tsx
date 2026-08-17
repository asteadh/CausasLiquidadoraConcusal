"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

export default function ActivityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error loading activity:", error);
  }, [error]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
        <p className="text-muted-foreground text-sm">
          Revisa las sesiones activas de tu cuenta en todos tus dispositivos.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="text-destructive h-8 w-8" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No se pudieron cargar las sesiones</p>
            <p className="text-muted-foreground text-sm">
              Ocurrió un error al obtener tu actividad. Inténtalo de nuevo.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => reset()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
