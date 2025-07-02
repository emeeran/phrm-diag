import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EmergencyContacts from "@/components/dashboard/emergency/emergency-contacts";

export default async function EmergencyContactsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Emergency Contacts</h1>
        <EmergencyContacts />
      </div>
    </div>
  );
}
