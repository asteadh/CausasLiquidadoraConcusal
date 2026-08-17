import { ActivityView } from "@/components/settings/activity-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) {
    redirect("/login");
  }

  const sessions = await auth.api.listSessions({ headers: requestHeaders });

  return <ActivityView sessions={sessions} currentSessionId={session.session.id} />;
}
