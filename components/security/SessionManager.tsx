import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

interface Session {
  id: string;
  sessionToken: string;
  expires: string;
  userAgent?: string;
  ipAddress?: string;
  isCurrent?: boolean;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch("/api/user/sessions");
        const data = await response.json();
        
        // Mark the current session
        const currentSessionToken = session?.user?.sessionToken;
        const processedSessions = data.sessions.map((s: Session) => ({
          ...s,
          isCurrent: s.sessionToken === currentSessionToken,
        }));
        
        setSessions(processedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast({
          title: "Error",
          description: "Failed to load session information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchSessions();
    }
  }, [session, toast]);

  async function handleRevokeSession(sessionToken: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/sessions?sessionToken=${sessionToken}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Remove the session from the list
        setSessions(sessions.filter(s => s.sessionToken !== sessionToken));
        
        toast({
          title: "Session Revoked",
          description: "The session has been successfully revoked",
        });
      } else {
        throw new Error("Failed to revoke session");
      }
    } catch (error) {
      console.error("Error revoking session:", error);
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeAllSessions() {
    if (!confirm("Are you sure you want to sign out of all other devices? You'll stay signed in on this device.")) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch("/api/user/sessions", {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Keep only the current session in the list
        setSessions(sessions.filter(s => s.isCurrent));
        
        toast({
          title: "Sessions Revoked",
          description: "You've been signed out of all other devices",
        });
      } else {
        throw new Error("Failed to revoke all sessions");
      }
    } catch (error) {
      console.error("Error revoking all sessions:", error);
      toast({
        title: "Error",
        description: "Failed to sign out of all devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function formatSessionInfo(session: Session) {
    const expires = new Date(session.expires);
    
    // Extract device info from user agent
    let device = "Unknown device";
    const userAgent = session.userAgent || "";
    
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      device = userAgent.includes("iPhone") ? "iPhone" : "iPad";
    } else if (userAgent.includes("Android")) {
      device = "Android device";
    } else if (userAgent.includes("Mac")) {
      device = "Mac computer";
    } else if (userAgent.includes("Windows")) {
      device = "Windows computer";
    } else if (userAgent.includes("Linux")) {
      device = "Linux computer";
    }
    
    return {
      device,
      expires: expires.toLocaleString(),
      ipAddress: session.ipAddress || "Unknown location",
    };
  }

  if (loading) {
    return <p>Loading sessions...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          These are the devices that are currently signed in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <Alert>
            <AlertDescription>No active sessions found</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(s => {
                const { device, expires, ipAddress } = formatSessionInfo(s);
                
                return (
                  <TableRow key={s.sessionToken}>
                    <TableCell className="font-medium">{device}</TableCell>
                    <TableCell>{expires}</TableCell>
                    <TableCell>{ipAddress}</TableCell>
                    <TableCell>
                      {s.isCurrent ? (
                        <Badge>Current</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!s.isCurrent && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRevokeSession(s.sessionToken)}
                          disabled={loading}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {sessions.length > 1 && (
          <div className="mt-4">
            <Button 
              variant="destructive"
              onClick={handleRevokeAllSessions}
              disabled={loading}
            >
              Sign Out Of All Other Devices
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
