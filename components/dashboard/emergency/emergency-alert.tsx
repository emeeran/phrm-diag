"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EmergencyAlertProps {
  userName: string;
}

export default function EmergencyAlert({ userName }: EmergencyAlertProps) {
  const [message, setMessage] = useState("");
  const [includeLocation, setIncludeLocation] = useState(true);
  const [location, setLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude}, ${longitude}`);
        setIsLocating(false);
      },
      (error) => {
        setError("Unable to retrieve your location");
        setIsLocating(false);
        setIncludeLocation(false);
      }
    );
  };

  const sendEmergencyAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message) {
      setError("Please provide an emergency message");
      return;
    }
    
    setSending(true);
    setError("");
    
    try {
      const response = await fetch("/api/emergency/alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          location: includeLocation ? location : null
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send emergency alert");
      }
      
      setSuccess(true);
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Try to get location when component mounts and includeLocation is true
  if (includeLocation && !location && !isLocating) {
    getLocation();
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center text-red-700">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Emergency Alert System
        </CardTitle>
        <CardDescription className="text-red-600">
          Send an urgent alert to all your family members
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">
              Emergency alert sent successfully to your family members. They will be notified immediately.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={sendEmergencyAlert} className="space-y-4">
            <div>
              <Label htmlFor="emergency-message">Emergency Message</Label>
              <Textarea
                id="emergency-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`I need immediate assistance with...`}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="include-location"
                checked={includeLocation}
                onCheckedChange={setIncludeLocation}
              />
              <Label htmlFor="include-location">Include my current location</Label>
            </div>
            
            {includeLocation && (
              <div className="rounded-md bg-blue-50 p-3 text-sm">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    {isLocating ? (
                      <p className="text-blue-700">Detecting your location...</p>
                    ) : location ? (
                      <p className="text-blue-700">Location detected. Your coordinates will be shared.</p>
                    ) : (
                      <p className="text-blue-700">Location detection failed. Try again or disable this feature.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700"
                disabled={sending || (includeLocation && !location && !error)}
              >
                {sending ? (
                  <>Sending Alert...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Emergency Alert
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 mt-4 border-t pt-4">
              <p>This will send an emergency notification to all family members connected to your account.</p>
              <p className="mt-1">Use this feature only for genuine emergencies requiring immediate assistance.</p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
