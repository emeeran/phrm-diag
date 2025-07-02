import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import HealthRecordEditForm from "@/components/dashboard/health-record-edit-form";

export default async function EditHealthRecordPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Health Record</h1>
        <HealthRecordEditForm recordId={params.id} user={{ email: session.user?.email as string }} />
      </div>
    </div>
  );
}
