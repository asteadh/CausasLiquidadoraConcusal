"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { revokeSession } from "@/lib/auth-client";
import { parseUserAgent } from "@/lib/user-agent";
import { useMutation } from "@tanstack/react-query";
import { Activity, Loader2, LogOut, MapPin, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SessionRecord {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityViewProps {
  sessions: SessionRecord[];
  currentSessionId: string;
}

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

export function ActivityView({ sessions, currentSessionId }: ActivityViewProps) {
  const [list, setList] = useState(sessions);

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const result = await revokeSession({ token });
      if (result.error) {
        throw new Error(result.error.message || "No se pudo cerrar la sesión");
      }
      return token;
    },
    onSuccess: (token) => {
      setList((prev) => prev.filter((s) => s.token !== token));
      toast.success("Sesión cerrada correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo cerrar la sesión");
    },
  });

  const ordered = [...list].sort((a, b) => {
    if (a.id === currentSessionId) return -1;
    if (b.id === currentSessionId) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Actividad</h1>
        <p className="text-muted-foreground text-sm">
          Revisa las sesiones activas de tu cuenta en todos tus dispositivos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sesiones activas
          </CardTitle>
          <CardDescription>
            Estos son los dispositivos que actualmente tienen una sesión iniciada en tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ordered.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No hay sesiones activas.
            </p>
          )}

          {ordered.map((session) => {
            const { label, os } = parseUserAgent(session.userAgent);
            const isCurrent = session.id === currentSessionId;
            const isMobile = /android|ios/i.test(os);
            const isRevoking =
              revokeMutation.isPending && revokeMutation.variables === session.token;

            return (
              <div
                key={session.id}
                className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  {isMobile ? (
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <Monitor className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      {isCurrent && <Badge variant="default">Sesión actual</Badge>}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                      {session.ipAddress && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.ipAddress}
                        </span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>Última actividad: {dateFormatter.format(new Date(session.updatedAt))}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Iniciada el {dateFormatter.format(new Date(session.createdAt))}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeMutation.mutate(session.token)}
                    disabled={revokeMutation.isPending}
                  >
                    {isRevoking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Cerrar sesión
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
