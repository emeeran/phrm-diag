import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export function ConsentBanner() {
  const [showConsent, setShowConsent] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [activeTab, setActiveTab] = useState("privacy");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the consent
    const consentAcknowledged = localStorage.getItem("consentAcknowledged");
    
    if (!consentAcknowledged) {
      // Show consent after a short delay to avoid immediate popup on first visit
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setHasAcknowledged(true);
    }
  }, []);

  const handleAccept = async () => {
    if (acceptedTerms && acceptedPrivacy) {
      // Record consent in backend if user is logged in
      try {
        const response = await fetch("/api/user/consent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            consents: {
              dataProcessingAccepted: true,
              termsAccepted: true,
              privacyAccepted: true,
            },
          }),
        });
      } catch (error) {
        console.error("Error recording consent:", error);
      }
      
      // Store acknowledgment in localStorage
      localStorage.setItem("consentAcknowledged", "true");
      localStorage.setItem("consentTimestamp", new Date().toISOString());
      
      setHasAcknowledged(true);
      setShowConsent(false);
    }
  };

  if (hasAcknowledged || !showConsent) {
    return null;
  }

  return (
    <Dialog open={showConsent} onOpenChange={setShowConsent}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Privacy & Terms</DialogTitle>
          <DialogDescription>
            Before using PHRM-Diag, please review and accept our Terms of Service and Privacy Policy.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          </TabsList>
          
          <TabsContent value="privacy" className="max-h-[50vh] overflow-y-auto p-4 border rounded-md mt-2">
            <div className="prose prose-sm">
              <h2>Privacy Policy Highlights</h2>
              <p>Our Privacy Policy explains how PHRM-Diag collects, uses, and protects your personal health information.</p>
              
              <h3>Key Points:</h3>
              <ul>
                <li>We collect health information that you choose to provide</li>
                <li>Your data is encrypted in transit and at rest</li>
                <li>We only share your information with your explicit consent</li>
                <li>You can export or delete your data at any time</li>
                <li>We implement appropriate security measures to protect your information</li>
              </ul>
              
              <p>
                <Link href="/legal/privacy-policy" target="_blank" className="underline">
                  Read the full Privacy Policy
                </Link>
              </p>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="privacy-accept" 
                  checked={acceptedPrivacy} 
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)} 
                />
                <Label htmlFor="privacy-accept">
                  I have read and agree to the Privacy Policy
                </Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="terms" className="max-h-[50vh] overflow-y-auto p-4 border rounded-md mt-2">
            <div className="prose prose-sm">
              <h2>Terms of Service Highlights</h2>
              <p>Our Terms of Service outline the rules and guidelines for using PHRM-Diag.</p>
              
              <h3>Key Points:</h3>
              <ul>
                <li>PHRM-Diag is not a substitute for professional medical advice</li>
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You retain all rights to health information and documents you upload</li>
                <li>We may modify or discontinue the Service at any time</li>
                <li>The Service is provided "as is" without warranties</li>
              </ul>
              
              <p>
                <Link href="/legal/terms-of-service" target="_blank" className="underline">
                  Read the full Terms of Service
                </Link>
              </p>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms-accept" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)} 
                />
                <Label htmlFor="terms-accept">
                  I have read and agree to the Terms of Service
                </Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!acceptedTerms || !acceptedPrivacy}
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
