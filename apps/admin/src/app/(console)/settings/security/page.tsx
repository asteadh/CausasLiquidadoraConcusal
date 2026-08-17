import { SecurityView } from "@/components/security/security-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SecurityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  const twoFactorEnabled = (session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false;

  return <SecurityView twoFactorEnabled={twoFactorEnabled} />;
}
