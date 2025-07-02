"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, CardLoading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, User } from "lucide-react";
import Link from "next/link";

interface HealthRecord {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function FamilyHealthTimeline() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFamilyHealthRecords();
  }, []);

  const fetchFamilyHealthRecords = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/family/records");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch family health records");
      }
      
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "symptoms":
        return <Badge className="bg-orange-500">Symptoms</Badge>;
      case "medications":
        return <Badge className="bg-blue-500">Medications</Badge>;
      case "appointments":
        return <Badge className="bg-green-500">Appointments</Badge>;
      case "lab_results":
        return <Badge className="bg-purple-500">Lab Results</Badge>;
      default:
        return <Badge className="bg-gray-500">{category}</Badge>;
    }
  };

  if (loading) {
    return <CardLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Group records by date
  const recordsByDate: Record<string, HealthRecord[]> = {};
  records.forEach((record) => {
    const date = new Date(record.date).toLocaleDateString();
    if (!recordsByDate[date]) {
      recordsByDate[date] = [];
    }
    recordsByDate[date].push(record);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(recordsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No family health records yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Family health records will appear here once they are shared.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Health Timeline</CardTitle>
        <CardDescription>
          View health records for you and your family members in chronological order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="text-md font-semibold text-gray-800">{date}</h3>
              </div>
              
              <div className="border-l-2 border-gray-200 pl-4 ml-2 space-y-6">
                {recordsByDate[date].map((record) => (
                  <div key={record.id} className="relative">
                    <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/dashboard/records/${record.id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-800"
                          >
                            {record.title}
                          </Link>
                          <div className="mt-1 flex items-center space-x-2">
                            {getCategoryBadge(record.category)}
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(record.date).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-500 text-right">
                            <div className="flex items-center justify-end">
                              <User className="h-3 w-3 mr-1" />
                              {record.user.name || record.user.email}
                            </div>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {record.user.name 
                                ? record.user.name.charAt(0).toUpperCase() 
                                : record.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      
                      {record.description && (
                        <p className="mt-2 text-gray-700 line-clamp-2">{record.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
