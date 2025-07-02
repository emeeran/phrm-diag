"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HealthRecord, Document } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HealthRecordDetailProps {
  recordId: string;
  user: { email: string };
}

export default function HealthRecordDetail({ recordId, user }: HealthRecordDetailProps) {
  const [record, setRecord] = useState<HealthRecord & { documents: Document[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecord() {
      try {
        const res = await fetch(`/api/health-record/${recordId}`);
        if (res.ok) {
          const data = await res.json();
          setRecord(data);
        }
      } catch (error) {
        console.error("Failed to fetch record:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [recordId]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this health record?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/health-record/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/records");
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!record) {
    return <div className="text-red-500">Health record not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{record.title}</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/records/${record.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="font-medium text-gray-700">Category:</label>
          <p className="text-gray-900 capitalize">{record.category.replace('_', ' ')}</p>
        </div>
        
        <div>
          <label className="font-medium text-gray-700">Date:</label>
          <p className="text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
        </div>
        
        {record.description && (
          <div>
            <label className="font-medium text-gray-700">Description:</label>
            <p className="text-gray-900 whitespace-pre-wrap">{record.description}</p>
          </div>
        )}
        
        {record.documents && record.documents.length > 0 && (
          <div>
            <label className="font-medium text-gray-700">Documents:</label>
            <ul className="space-y-2 mt-2">
              {record.documents.map((doc) => (
                <li key={doc.id} className="flex items-center space-x-2">
                  <a 
                    href={doc.url || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {doc.originalName}
                  </a>
                  <span className="text-sm text-gray-500">
                    ({(doc.size / 1024).toFixed(1)} KB)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="text-sm text-gray-500 pt-4 border-t">
          Created: {new Date(record.createdAt).toLocaleString()}
          {record.updatedAt !== record.createdAt && (
            <span> | Updated: {new Date(record.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
      
      <Link href="/dashboard/records">
        <Button variant="outline">← Back to Records</Button>
      </Link>
    </div>
  );
}
