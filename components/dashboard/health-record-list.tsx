"use client";
import { useState, useEffect } from "react";
import { HealthRecord, Document } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading";
import { ErrorDisplay, handleApiError } from "@/components/ui/error-boundary";
import { FileText, Calendar, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HealthRecordWithDocuments extends HealthRecord {
  documents: Document[];
}

interface HealthRecordListProps {
  user: { email: string };
}

export default function HealthRecordList({ user }: HealthRecordListProps) {
  const [records, setRecords] = useState<HealthRecordWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "symptoms", label: "Symptoms" },
    { value: "medications", label: "Medications" },
    { value: "appointments", label: "Appointments" },
    { value: "lab_results", label: "Lab Results" },
  ];

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/health-record");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw { status: res.status, message: errorData.error || 'Failed to fetch records' };
      }
      
      const data = await res.json();
      setRecords(data);
    } catch (error: any) {
      console.error("Failed to fetch records:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || record.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      symptoms: "bg-red-100 text-red-800",
      medications: "bg-blue-100 text-blue-800",
      appointments: "bg-green-100 text-green-800",
      lab_results: "bg-purple-100 text-purple-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <LoadingState message="Loading your health records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-600">Manage your personal health information</p>
        </div>
        <Link href="/dashboard/records/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add New Record
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      <ErrorDisplay error={error} onRetry={fetchRecords} />

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {records.length === 0 ? "No health records yet" : "No records match your search"}
              </h3>
              <p className="text-gray-600 mb-6">
                {records.length === 0 
                  ? "Start building your health profile by adding your first record."
                  : "Try adjusting your search terms or category filter."
                }
              </p>
              {records.length === 0 && (
                <Link href="/dashboard/records/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Record
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                      <Badge className={getCategoryColor(record.category)}>
                        {record.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(record.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    
                    {record.description && (
                      <p className="text-gray-700 mb-3 line-clamp-2">{record.description}</p>
                    )}
                    
                    {record.documents && record.documents.length > 0 && (
                      <div className="flex items-center text-sm text-blue-600">
                        <FileText className="h-4 w-4 mr-1" />
                        {record.documents.length} document{record.documents.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/dashboard/records/${record.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                    <Link href={`/dashboard/records/${record.id}/edit`}>
                      <Button size="sm" variant="secondary">Edit</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Summary */}
      {records.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">
              Showing {filteredRecords.length} of {records.length} records
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
