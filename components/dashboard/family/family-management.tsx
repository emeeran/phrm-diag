"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState, CardLoading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, UserPlus, X, Check, UserX, Shield, Edit, Eye, EyeOff, Users } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface FamilyMember {
  id: string;
  name: string | null;
  email: string;
  permission: "view" | "edit" | "admin";
  status: "active" | "invited";
  memberUserId: string;
  primaryUserId: string;
}

interface FamilyManagementProps {
  userEmail: string;
}

export default function FamilyManagement({ userEmail }: FamilyManagementProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/family/members");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch family members");
      }
      
      setFamilyMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inviteFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch("/api/family/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          permission,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }
      
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      fetchFamilyMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const updatePermission = async (memberId: string, newPermission: "view" | "edit" | "admin") => {
    setError("");
    
    try {
      const response = await fetch(`/api/family/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permission: newPermission,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update permission");
      }
      
      fetchFamilyMembers();
      setOpenEditDialog(false);
      setEditingMember(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeFamilyMember = async (memberId: string) => {
    setError("");
    
    if (!confirm("Are you sure you want to remove this family member?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/family/members/${memberId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove family member");
      }
      
      fetchFamilyMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case "admin":
        return <Badge className="bg-purple-500">{<Shield className="w-3 h-3 mr-1" />} Admin</Badge>;
      case "edit":
        return <Badge className="bg-blue-500">{<Edit className="w-3 h-3 mr-1" />} Edit</Badge>;
      default:
        return <Badge className="bg-gray-500">{<Eye className="w-3 h-3 mr-1" />} View</Badge>;
    }
  };

  if (loading) {
    return <CardLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-8">
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Invite a Family Member</CardTitle>
          <CardDescription>
            Invite family members to share health records and information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={inviteFamilyMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="permission">Permission Level</Label>
                <Select 
                  value={permission} 
                  onValueChange={(value: "view" | "edit" | "admin") => setPermission(value)}
                >
                  <SelectTrigger id="permission" className="mt-1">
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={inviting || !inviteEmail}
              className="mt-2"
            >
              {inviting ? (
                <>Sending Invitation...</>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {familyMembers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No family members yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Invite family members to share health records and information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Family Members</CardTitle>
            <CardDescription>
              Manage family members and their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familyMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between border rounded-md p-4"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                      <div className="mt-1">
                        {getPermissionBadge(member.permission)}
                        {member.status === "invited" && (
                          <Badge className="ml-2 bg-yellow-500">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Dialog open={openEditDialog && editingMember?.id === member.id} onOpenChange={(open) => {
                      setOpenEditDialog(open);
                      if (!open) setEditingMember(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingMember(member);
                            setOpenEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Permissions</DialogTitle>
                          <DialogDescription>
                            Update access level for {member.name || member.email}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          <Label htmlFor="edit-permission">Permission Level</Label>
                          <Select 
                            value={editingMember?.permission || member.permission}
                            onValueChange={(value: "view" | "edit" | "admin") => {
                              if (editingMember) {
                                setEditingMember({...editingMember, permission: value});
                              }
                            }}
                          >
                            <SelectTrigger id="edit-permission">
                              <SelectValue placeholder="Select permission" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">
                                <div className="flex items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Only
                                </div>
                              </SelectItem>
                              <SelectItem value="edit">
                                <div className="flex items-center">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center">
                                  <Shield className="h-4 w-4 mr-2" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="mt-4 text-sm text-gray-500">
                            <p><strong>View:</strong> Can only see health records</p>
                            <p><strong>Edit:</strong> Can see and edit health records</p>
                            <p><strong>Admin:</strong> Full access, including inviting others</p>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setOpenEditDialog(false);
                              setEditingMember(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (editingMember) {
                                updatePermission(editingMember.id, editingMember.permission);
                              }
                            }}
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => removeFamilyMember(member.id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
