import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NotificationsPanel from "@/components/dashboard/notifications/notifications-panel";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <NotificationsPanel />
      </div>
    </div>
  );
}
