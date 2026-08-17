"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { Session } from "@/lib/auth-client";
import { Calendar, Check, CheckCircle2, Copy, Hash, Settings, XCircle } from "lucide-react";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "long" });

export function ProfileView({ user }: { user: Session["user"] }) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const initials = user.name?.slice(0, 1).toUpperCase() || user.email.slice(0, 1).toUpperCase();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground text-sm">
            Información de tu cuenta en Causas Liquidadora Concursal.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings/general">
            <Settings className="h-4 w-4" />
            Editar perfil
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{user.email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.email)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Copiar correo"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              {user.emailVerified ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="text-muted-foreground h-5 w-5" />
              )}
              <div>
                <p className="text-sm font-medium">Correo</p>
                <Badge variant={user.emailVerified ? "default" : "secondary"} className="mt-1">
                  {user.emailVerified ? "Verificado" : "Sin verificar"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Miembro desde</p>
                <p className="text-muted-foreground text-sm">
                  {dateFormatter.format(new Date(user.createdAt))}
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Hash className="text-muted-foreground h-5 w-5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">ID de cuenta</p>
              <p className="text-muted-foreground truncate text-sm">{user.id}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(user.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copiar ID de cuenta"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        Gestiona tu contraseña, autenticación en dos pasos y sesiones activas en{" "}
        <Link href="/settings/security" className="text-primary underline underline-offset-4">
          Seguridad
        </Link>
        .
      </p>
    </section>
  );
}
