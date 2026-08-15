import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/causas">Causas</Link>
            <Link href="/clientes">Clientes</Link>
          </nav>
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <span>{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
