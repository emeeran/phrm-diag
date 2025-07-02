import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import HealthRecordDetail from "@/components/dashboard/health-record-detail";

export default async function HealthRecordDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <HealthRecordDetail recordId={params.id} user={session.user} />
      </div>
    </div>
  );
}
