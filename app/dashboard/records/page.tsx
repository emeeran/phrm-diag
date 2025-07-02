import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import HealthRecordList from "@/components/dashboard/health-record-list";

export default async function HealthRecordsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Health Records</h1>
        <HealthRecordList user={session.user} />
      </div>
    </div>
  );
}
