import { AdminSidebar } from "@/components/admin-sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Activity } from "lucide-react";

export function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="bg-background flex h-16 items-center justify-between gap-3 border-b px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <div className="text-muted-foreground hidden min-w-0 items-center gap-2 text-sm sm:flex">
              <Activity className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="truncate">Monitoreo de producción</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-medium">{userEmail}</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
