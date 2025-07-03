'use client';

import { ConsentManager } from "@/components/consent/ConsentManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function PrivacySettings() {
  const [activeTab, setActiveTab] = useState("consent");
  const [requestingData, setRequestingData] = useState(false);
  const { toast } = useToast();

  const handleDataExportRequest = async () => {
    setRequestingData(true);
    
    try {
      const response = await fetch("/api/user/data-export", {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "Data Export Requested",
          description: "Your data will be prepared and sent to your email address within 48 hours.",
        });
      } else {
        throw new Error("Failed to request data export");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request data export. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setRequestingData(false);
    }
  };

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="consent">Privacy & Consent</TabsTrigger>
          <TabsTrigger value="data">Your Data</TabsTrigger>
          <TabsTrigger value="legal">Legal Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="consent">
          <ConsentManager />
        </TabsContent>
        
        <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Portability</CardTitle>
                <CardDescription>
                  Export your data or request account deletion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can request a complete export of your personal and health data in a machine-readable format.
                    The export will be prepared and sent to your email address within 48 hours.
                  </p>
                  <Button onClick={handleDataExportRequest} disabled={requestingData}>
                    {requestingData ? "Requesting..." : "Request Data Export"}
                  </Button>
                </div>
                
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-medium">Account Deletion</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can request complete deletion of your account and all associated data.
                    This process cannot be undone.
                  </p>
                  <Button variant="destructive">
                    Request Account Deletion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>
                Privacy policy, terms of service, and other legal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Privacy Policy</h3>
                <p className="text-sm text-muted-foreground">
                  Our privacy policy details how we collect, use, and protect your personal information.
                </p>
                <Link href="/legal/privacy-policy">
                  <Button variant="outline">View Privacy Policy</Button>
                </Link>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-lg font-medium">Terms of Service</h3>
                <p className="text-sm text-muted-foreground">
                  Our terms of service outline the rules and guidelines for using PHRM-Diag.
                </p>
                <Link href="/legal/terms-of-service">
                  <Button variant="outline">View Terms of Service</Button>
                </Link>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-lg font-medium">HIPAA Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Information about how we comply with healthcare privacy regulations.
                </p>
                <Button variant="outline" disabled>Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
