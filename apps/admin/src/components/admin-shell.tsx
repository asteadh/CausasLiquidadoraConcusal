import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export function AdminShell({ children, user }: AdminShellProps) {
  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <header className="bg-background flex h-14 items-center border-b px-4 lg:hidden">
          <SidebarTrigger />
        </header>
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
