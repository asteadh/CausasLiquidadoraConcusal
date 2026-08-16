import { ConsoleSidebar } from "@/components/console-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ConsoleSidebar email={session.user.email} />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
  );
}
