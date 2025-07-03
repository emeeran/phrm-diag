import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { InfoIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "../ui/use-toast";
import Link from "next/link";

interface ConsentSettings {
  analyticsConsent: boolean;
  marketingConsent: boolean;
  thirdPartyConsent: boolean;
  dataRetentionPeriod: string;
  aiProcessingConsent: boolean;
  locationConsent: boolean;
  healthDataSharing: boolean;
}

const defaultSettings: ConsentSettings = {
  analyticsConsent: false,
  marketingConsent: false,
  thirdPartyConsent: false,
  dataRetentionPeriod: "3years",
  aiProcessingConsent: true,
  locationConsent: false,
  healthDataSharing: false,
};

export function ConsentManager() {
  const [consents, setConsents] = useState<ConsentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch user's consent settings
    const fetchConsentSettings = async () => {
      try {
        const response = await fetch("/api/user/consent");
        if (response.ok) {
          const data = await response.json();
          setConsents(data.consents || defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching consent settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsentSettings();
  }, []);

  const handleToggleConsent = (key: keyof ConsentSettings) => {
    setConsents({
      ...consents,
      [key]: !consents[key],
    });
  };

  const handleRetentionChange = (value: string) => {
    setConsents({
      ...consents,
      dataRetentionPeriod: value,
    });
  };

  const handleSaveConsents = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/user/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consents }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        toast({
          title: "Consent settings saved",
          description: "Your privacy preferences have been updated.",
        });
      } else {
        throw new Error("Failed to save consent settings");
      }
    } catch (error) {
      console.error("Error saving consent settings:", error);
      
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading your privacy preferences...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Privacy & Consent Settings</CardTitle>
        <CardDescription>
          Manage how your data is collected, used, and shared
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {showSuccess && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Saved successfully</AlertTitle>
            <AlertDescription>Your privacy preferences have been updated.</AlertDescription>
          </Alert>
        )}

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>About Your Privacy</AlertTitle>
          <AlertDescription>
            PHRM-Diag is committed to protecting your personal health information. You can review our{" "}
            <Link href="/legal/privacy-policy" className="font-medium underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/terms-of-service" className="font-medium underline">
              Terms of Service
            </Link>{" "}
            for more details.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="essential">
            <AccordionTrigger>Essential Health Data Processing</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We require certain permissions to provide core app functionality. These settings cannot be disabled.
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Health Record Storage</p>
                    <p className="text-sm text-muted-foreground">
                      Storing your health records securely in our database
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentication & Security</p>
                    <p className="text-sm text-muted-foreground">
                      Processing login information and security-related data
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="ai">
            <AccordionTrigger>AI Processing Consent</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Control how we use AI to analyze your health data and provide insights.
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Health Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Allow our AI systems to analyze your health records and provide insights
                    </p>
                  </div>
                  <Switch 
                    checked={consents.aiProcessingConsent} 
                    onCheckedChange={() => handleToggleConsent('aiProcessingConsent')} 
                  />
                </div>
                
                {!consents.aiProcessingConsent && (
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Limited Functionality</AlertTitle>
                    <AlertDescription>
                      Disabling AI processing will limit health insights, trend analysis, and diagnostic assistance features.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="optional">
            <AccordionTrigger>Optional Data Collection</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Collect anonymous usage data to improve the application
                    </p>
                  </div>
                  <Switch 
                    checked={consents.analyticsConsent} 
                    onCheckedChange={() => handleToggleConsent('analyticsConsent')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Communications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and improvements
                    </p>
                  </div>
                  <Switch 
                    checked={consents.marketingConsent} 
                    onCheckedChange={() => handleToggleConsent('marketingConsent')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Location Data</p>
                    <p className="text-sm text-muted-foreground">
                      Use location for emergency features and nearby healthcare providers
                    </p>
                  </div>
                  <Switch 
                    checked={consents.locationConsent} 
                    onCheckedChange={() => handleToggleConsent('locationConsent')} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Third-Party Integrations</p>
                    <p className="text-sm text-muted-foreground">
                      Allow sharing data with third-party health services you connect
                    </p>
                  </div>
                  <Switch 
                    checked={consents.thirdPartyConsent} 
                    onCheckedChange={() => handleToggleConsent('thirdPartyConsent')} 
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="data-retention">
            <AccordionTrigger>Data Retention</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose how long we keep your health records and account data.
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium">Health Data Retention Period</p>
                  
                  <div className="grid gap-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="retentionPeriod" 
                        value="1year"
                        checked={consents.dataRetentionPeriod === "1year"} 
                        onChange={() => handleRetentionChange("1year")} 
                        className="form-radio" 
                      />
                      <span>1 year after account closure</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="retentionPeriod" 
                        value="3years"
                        checked={consents.dataRetentionPeriod === "3years"} 
                        onChange={() => handleRetentionChange("3years")} 
                        className="form-radio" 
                      />
                      <span>3 years after account closure (recommended)</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="retentionPeriod" 
                        value="7years"
                        checked={consents.dataRetentionPeriod === "7years"} 
                        onChange={() => handleRetentionChange("7years")} 
                        className="form-radio" 
                      />
                      <span>7 years after account closure</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="retentionPeriod" 
                        value="indefinite"
                        checked={consents.dataRetentionPeriod === "indefinite"} 
                        onChange={() => handleRetentionChange("indefinite")} 
                        className="form-radio" 
                      />
                      <span>Indefinite (until explicit deletion request)</span>
                    </label>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="health-data-sharing">
            <AccordionTrigger>Health Data Sharing</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Control how your health data is shared with family members and healthcare providers.
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Family Sharing</p>
                    <p className="text-sm text-muted-foreground">
                      Enable family members to access your health records (additional permissions apply)
                    </p>
                  </div>
                  <Switch 
                    checked={consents.healthDataSharing} 
                    onCheckedChange={() => handleToggleConsent('healthDataSharing')} 
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSaveConsents} 
          disabled={saving}
          className="ml-auto"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
