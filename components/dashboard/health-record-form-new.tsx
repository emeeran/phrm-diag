"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorDisplay, handleApiError } from "@/components/ui/error-boundary";

const categories = [
  { value: "symptoms", label: "Symptoms" },
  { value: "medications", label: "Medications" },
  { value: "appointments", label: "Appointments" },
  { value: "lab_results", label: "Lab Results" },
];

export default function HealthRecordForm({ user }: { user: { email: string } }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(null);
    
    try {
      // Validate form data
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      if (!date) {
        throw new Error("Date is required");
      }

      // First create the health record
      const res = await fetch("/api/health-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim() || null, 
          date, 
          category 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw { status: res.status, message: errorData.error || 'Failed to create record' };
      }

      const record = await res.json();
      
      // Upload files if any
      if (files && files.length > 0) {
        setUploadProgress(`Uploading ${files.length} file(s)...`);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`Uploading file ${i + 1} of ${files.length}: ${file.name}`);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('healthRecordId', record.id);
          
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!uploadRes.ok) {
            console.warn(`Failed to upload file: ${file.name}`);
          }
        }
      }
      
      router.push("/dashboard/records");
    } catch (error: any) {
      console.error('Error creating health record:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  const handleRetry = () => {
    setError(null);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Health Record</CardTitle>
        <CardDescription>
          Record your health information, symptoms, medications, or appointment details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title"
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., Annual checkup, Blood test results, Headache symptoms"
              required 
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide additional details about this health record..."
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input 
              id="date"
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
              disabled={loading}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select 
              id="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              required
              disabled={loading}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Documents (optional)</Label>
            <Input 
              id="files"
              type="file" 
              multiple 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              onChange={e => setFiles(e.target.files)} 
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              Upload medical documents, test results, prescriptions, etc. (PDF, DOC, images)
            </p>
          </div>

          <ErrorDisplay error={error} onRetry={handleRetry} />

          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-blue-800">{uploadProgress}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {uploadProgress ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                'Save Record'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
