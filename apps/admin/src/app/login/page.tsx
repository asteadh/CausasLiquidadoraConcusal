"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { CausasLogo, GoogleMark } from "@/components/brand";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn.email({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message ?? "No se pudo iniciar sesión.");
      return;
    }

    router.push("/causas");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error: signInError } = await signIn.social({
      provider: "google",
      callbackURL: "/causas",
    });

    if (signInError) {
      setGoogleLoading(false);
      setError(signInError.message ?? "No se pudo iniciar sesión con Google.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 px-4 py-10">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto"><CausasLogo /></div>
          <div>
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription className="mt-2">Accede al panel de causas de liquidación concursal.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Correo
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" className="pl-9" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
                <Link className="text-sm font-medium text-blue-700 hover:underline" href="/forgot-password">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" className="pl-9" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" className="gap-2" disabled={loading || googleLoading}>
              {loading ? "Ingresando..." : <>Ingresar <ArrowRight className="size-4" /></>}
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />o continúa con<div className="h-px flex-1 bg-border" /></div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
            {googleLoading ? "Redirigiendo a Google..." : <><GoogleMark />Continuar con Google</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
