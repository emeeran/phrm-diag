import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { InfoCircledIcon, CheckCircledIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Image from "next/image";

interface MFASetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<"init" | "qrcode" | "verify" | "backupCodes" | "complete">("init");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  async function startSetup() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to start MFA setup");
      }

      const data = await response.json();
      setQrCode(data.qrCodeUrl);
      setSecret(data.secret);
      setStep("qrcode");
    } catch (err: any) {
      setError(err.message || "An error occurred during MFA setup");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        throw new Error("Invalid verification code");
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep("backupCodes");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function finishSetup() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to enable MFA");
      }

      setStep("complete");
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to enable MFA");
    } finally {
      setLoading(false);
    }
  }

  function renderContent() {
    switch (step) {
      case "init":
        return (
          <>
            <CardHeader>
              <CardTitle>Set up Two-Factor Authentication</CardTitle>
              <CardDescription>
                Enhance your account security by enabling two-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <InfoCircledIcon className="h-4 w-4" />
                <AlertTitle>What you&apos;ll need</AlertTitle>
                <AlertDescription>
                  An authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={startSetup} disabled={loading}>
                {loading ? "Setting up..." : "Start Setup"}
              </Button>
            </CardFooter>
          </>
        );
      
      case "qrcode":
        return (
          <>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              {qrCode && (
                <div className="border rounded-md p-2 bg-white">
                  <Image src={qrCode} alt="QR Code" width={200} height={200} />
                </div>
              )}
              
              {secret && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Or enter this code manually:
                  </p>
                  <code className="bg-secondary px-2 py-1 rounded text-sm">
                    {secret}
                  </code>
                </div>
              )}
              
              <div className="w-full mt-4">
                <label htmlFor="token" className="text-sm font-medium">
                  Enter the 6-digit code from your app
                </label>
                <Input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="mt-1"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("init")}>Back</Button>
              <Button onClick={verifyCode} disabled={loading || verificationCode.length !== 6}>
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </CardFooter>
          </>
        );
      
      case "backupCodes":
        return (
          <>
            <CardHeader>
              <CardTitle>Save Your Backup Codes</CardTitle>
              <CardDescription>
                Keep these codes in a safe place. You can use them if you lose access to your authenticator app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary rounded-md p-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="font-mono text-sm">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <Alert>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Each backup code can only be used once. Store them securely - they won&apos;t be shown again.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("qrcode")}>Back</Button>
              <Button onClick={finishSetup} disabled={loading}>
                {loading ? "Finishing..." : "Complete Setup"}
              </Button>
            </CardFooter>
          </>
        );
      
      case "complete":
        return (
          <>
            <CardHeader>
              <CardTitle>Two-Factor Authentication Enabled</CardTitle>
              <CardDescription>
                Your account is now protected with two-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircledIcon className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-center">
                  You&apos;ll now need to enter a verification code when signing in.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={onComplete} className="w-full">
                Done
              </Button>
            </CardFooter>
          </>
        );
    }
  }

  return <Card className="w-full max-w-md mx-auto">{renderContent()}</Card>;
}
