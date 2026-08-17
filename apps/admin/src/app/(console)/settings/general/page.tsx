import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function GeneralSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  return <GeneralSettingsForm user={session.user} />;
}
