"use client";

import { CausasLogo } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import { FileText, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ConsoleSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  return <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4">
    <div className="px-2 pb-6"><CausasLogo /></div>
    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gestión concursal</p>
    <nav className="space-y-1">
      <Link href="/causas" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", pathname.startsWith("/causas") ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><FileText className="size-4" />Causas</Link>
      <Link href="/clientes" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", pathname.startsWith("/clientes") ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><Users className="size-4" />Clientes</Link>
    </nav>
    <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{email.slice(0, 1).toUpperCase()}</span><span className="min-w-0 truncate text-xs font-medium text-slate-700">{email}</span></div><SignOutButton className="mt-3 w-full justify-center" /></div>
  </aside>;
}
