"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

interface InvitationAcceptProps {
  inviteToken: string;
}

export default function InvitationAccept({ inviteToken }: InvitationAcceptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<{
    fromName: string;
    fromEmail: string;
    permission: string;
  } | null>(null);

  const fetchInvitationDetails = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/family/invitations/${inviteToken}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invitation details");
      }
      
      setInvitationDetails(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/family/invitations/${inviteToken}/accept`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rejectInvitation = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/family/invitations/${inviteToken}/reject`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reject invitation");
      }
      
      setSuccess(false);
      setError("Invitation rejected");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invitation details on component mount
  useState(() => {
    fetchInvitationDetails();
  });

  if (loading) {
    return <LoadingState message="Loading invitation details..." />;
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Invitation Accepted</h3>
            <p className="mt-1 text-sm text-gray-500">
              You now have access to shared health records. You can access them from your dashboard.
            </p>
            <div className="mt-6">
              <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <XCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!invitationDetails) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertDescription className="text-yellow-700">
          Invalid or expired invitation. Please request a new invitation.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Health Access Invitation</CardTitle>
        <CardDescription>
          You have been invited to access family health records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Invited by</p>
            <p className="font-medium">{invitationDetails.fromName || invitationDetails.fromEmail}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Permission Level</p>
            <p className="font-medium">
              {invitationDetails.permission === "admin" 
                ? "Admin (Full access)" 
                : invitationDetails.permission === "edit" 
                  ? "Edit (Can view and modify records)" 
                  : "View (Read-only access)"}
            </p>
          </div>
          
          <div className="pt-4 flex space-x-4">
            <Button onClick={acceptInvitation} className="flex-1">
              Accept Invitation
            </Button>
            <Button 
              variant="outline" 
              onClick={rejectInvitation} 
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
