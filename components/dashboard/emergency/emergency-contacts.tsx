"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState, CardLoading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Heart, AlertCircle, Trash2, Plus, User, Mail, Home, FileText, Check } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formAction, setFormAction] = useState<"add" | "edit">("add");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [currentContact, setCurrentContact] = useState<EmergencyContact | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    phoneNumber: "",
    email: "",
    address: "",
    notes: ""
  });

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/emergency-contacts");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emergency contacts");
      }
      
      setContacts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      address: "",
      notes: ""
    });
    setCurrentContact(null);
  };

  const openAdd = () => {
    resetForm();
    setFormAction("add");
    setOpenAddDialog(true);
  };

  const openEdit = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      address: contact.address || "",
      notes: contact.notes || ""
    });
    setCurrentContact(contact);
    setFormAction("edit");
    setOpenEditDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      if (formAction === "add") {
        const response = await fetch("/api/emergency-contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to add emergency contact");
        }
        
        setSuccess(`${formData.name} has been added as an emergency contact.`);
        setOpenAddDialog(false);
        resetForm();
      } else {
        // Edit existing contact
        const response = await fetch(`/api/emergency-contacts/${currentContact!.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to update emergency contact");
        }
        
        setSuccess(`Emergency contact information for ${formData.name} has been updated.`);
        setOpenEditDialog(false);
        resetForm();
      }
      
      fetchEmergencyContacts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const removeContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your emergency contacts?`)) {
      return;
    }
    
    setError("");
    
    try {
      const response = await fetch(`/api/emergency-contacts/${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove emergency contact");
      }
      
      setSuccess(`${name} has been removed from your emergency contacts.`);
      fetchEmergencyContacts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <CardLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Emergency Contacts</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
      
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No emergency contacts yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add emergency contacts for quick access during medical emergencies.
            </p>
            <Button className="mt-4" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span>{contact.name}</span>
                </CardTitle>
                <CardDescription>{contact.relationship}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{contact.phoneNumber}</span>
                  </div>
                  
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{contact.email}</span>
                    </div>
                  )}
                  
                  {contact.address && (
                    <div className="flex items-start space-x-2">
                      <Home className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-900">{contact.address}</span>
                    </div>
                  )}
                  
                  {contact.notes && (
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-900">{contact.notes}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end space-x-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(contact)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => removeContact(contact.id, contact.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Contact Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add a new emergency contact that can be reached during medical emergencies.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Input
                    id="relationship"
                    name="relationship"
                    placeholder="Spouse, Parent, Friend, Doctor, etc."
                    value={formData.relationship}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions or additional information"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? "Saving..." : "Save Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Contact Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Emergency Contact</DialogTitle>
            <DialogDescription>
              Update the information for this emergency contact.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-relationship">Relationship *</Label>
                  <Input
                    id="edit-relationship"
                    name="relationship"
                    placeholder="Spouse, Parent, Friend, Doctor, etc."
                    value={formData.relationship}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
                  <Input
                    id="edit-phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions or additional information"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? "Updating..." : "Update Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
