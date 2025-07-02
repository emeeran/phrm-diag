import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import HealthRecordForm from "@/components/dashboard/health-record-form";

export default async function NewHealthRecordPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Health Record</h1>
        <HealthRecordForm user={session.user} />
      </div>
    </div>
  );
}
