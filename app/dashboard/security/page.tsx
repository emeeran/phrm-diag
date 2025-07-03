import SecuritySettingsWrapper from './client';

export default function SecuritySettingsPage() {
  return <SecuritySettingsWrapper />;
}

// Client component moved to client.tsx
  const [activeTab, setActiveTab] = useState("general");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  // Fetch user's current security settings
  useEffect(() => {
    async function fetchSecuritySettings() {
      try {
        const response = await fetch("/api/user/security");
        const data = await response.json();
        setMfaEnabled(data.mfaEnabled);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching security settings:", error);
        setLoading(false);
      }
    }

    if (session) {
      fetchSecuritySettings();
    }
  }, [session]);

  // Handle MFA toggle
  async function handleMfaToggle() {
    if (!mfaEnabled) {
      // Show MFA setup component when enabling
      setShowMfaSetup(true);
    } else {
      // Show confirmation dialog when disabling
      if (confirm("Are you sure you want to disable two-factor authentication? This will reduce the security of your account.")) {
        try {
          setLoading(true);
          const response = await fetch("/api/auth/mfa/disable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verificationCode: "000000" }), // This should be replaced with actual verification
          });

          if (response.ok) {
            setMfaEnabled(false);
            toast({
              title: "MFA Disabled",
              description: "Two-factor authentication has been disabled for your account.",
            });
          } else {
            const data = await response.json();
            toast({
              title: "Error",
              description: data.error || "Failed to disable MFA",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error disabling MFA:", error);
          toast({
            title: "Error",
            description: "An error occurred while disabling MFA",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    }
  }

  // Handle MFA setup completion
  function handleMfaSetupComplete() {
    setShowMfaSetup(false);
    setMfaEnabled(true);
    toast({
      title: "MFA Enabled",
      description: "Two-factor authentication has been enabled for your account.",
    });
  }

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6">Security Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="general">General Security</TabsTrigger>
          <TabsTrigger value="mfa">Two-Factor Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Login Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Security Settings</CardTitle>
              <CardDescription>Manage your account's security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Security Recommendations</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>Enable two-factor authentication for added security</li>
                    <li>Use a strong, unique password</li>
                    <li>Regularly review your login sessions</li>
                    <li>Keep your contact information up to date</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Password Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    Passwords must be at least 8 characters with a mix of letters, numbers, and symbols
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mfa">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account by requiring a verification code in addition to your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {showMfaSetup ? (
                <MFASetup 
                  onComplete={handleMfaSetupComplete} 
                  onCancel={() => setShowMfaSetup(false)} 
                />
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <KeyIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        {mfaEnabled 
                          ? "Your account is protected with two-factor authentication" 
                          : "Protect your account with an authenticator app"}
                      </p>
                    </div>
                    <Switch 
                      checked={mfaEnabled} 
                      onCheckedChange={handleMfaToggle} 
                      disabled={loading} 
                    />
                  </div>

                  {mfaEnabled && (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Two-Factor Authentication is Enabled</AlertTitle>
                      <AlertDescription>
                        You'll need to enter a verification code from your authenticator app each time you sign in.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!mfaEnabled && (
                    <Alert variant="destructive">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertTitle>Two-Factor Authentication is Disabled</AlertTitle>
                      <AlertDescription>
                        Your account is less secure. We strongly recommend enabling two-factor authentication.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Login Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleString()} • {navigator.platform}
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Current
                    </div>
                  </div>
                </div>

                {/* We'll populate this with actual session data in the future */}
                <p className="text-sm text-muted-foreground text-center py-4">
                  Login session management coming soon
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button variant="destructive">
                  Sign Out of All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
