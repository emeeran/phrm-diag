"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HealthRecord } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const categories = [
  "symptoms",
  "medications",
  "appointments",
  "lab_results",
];

interface HealthRecordEditFormProps {
  recordId: string;
  user: { email: string };
}

export default function HealthRecordEditForm({ recordId, user }: HealthRecordEditFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchRecord() {
      try {
        const res = await fetch(`/api/health-record/${recordId}`);
        if (res.ok) {
          const record: HealthRecord = await res.json();
          setTitle(record.title);
          setDescription(record.description || "");
          setDate(new Date(record.date).toISOString().split('T')[0]);
          setCategory(record.category);
        }
      } catch (error) {
        console.error("Failed to fetch record:", error);
        setError("Failed to load record");
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [recordId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/health-record/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, date, category }),
      });
      if (res.ok) {
        router.push(`/dashboard/records/${recordId}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update record");
      }
    } catch (error) {
      setError("Failed to update record");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input 
            type="text" 
            className="w-full border rounded px-3 py-2" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea 
            className="w-full border rounded px-3 py-2" 
            rows={4}
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1">Date</label>
          <input 
            type="date" 
            className="w-full border rounded px-3 py-2" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label className="block font-medium mb-1">Category</label>
          <select 
            className="w-full border rounded px-3 py-2" 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        
        {error && <div className="text-red-600">{error}</div>}
        
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Updating..." : "Update Record"}
          </Button>
          <Link href={`/dashboard/records/${recordId}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
