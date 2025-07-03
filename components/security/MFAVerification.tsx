import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ExclamationTriangleIcon, KeyIcon } from "@radix-ui/react-icons";
import { signIn } from "next-auth/react";

interface MFAVerificationProps {
  email: string;
  password: string;
  callbackUrl?: string;
  onCancel: () => void;
}

export function MFAVerification({ email, password, callbackUrl = "/dashboard", onCancel }: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingBackupCode, setUsingBackupCode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        mfaToken: verificationCode,
        callbackUrl,
      });

      if (result?.error) {
        setError(usingBackupCode ? "Invalid backup code" : "Invalid verification code");
      }
    } catch (err) {
      setError("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {usingBackupCode 
              ? "Enter one of your backup codes to sign in" 
              : "Enter the verification code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyIcon className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div>
            <label htmlFor="code" className="text-sm font-medium">
              {usingBackupCode ? "Backup Code" : "Verification Code"}
            </label>
            <Input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder={usingBackupCode ? "Enter backup code" : "000000"}
              className="mt-1"
              autoFocus
              autoComplete="one-time-code"
              inputMode={usingBackupCode ? "text" : "numeric"}
              pattern={usingBackupCode ? undefined : "[0-9]*"}
              maxLength={usingBackupCode ? undefined : 6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <button 
              type="button" 
              className="text-sm text-primary underline" 
              onClick={() => setUsingBackupCode(!usingBackupCode)}
            >
              {usingBackupCode 
                ? "Use authenticator app instead" 
                : "Use a backup code instead"}
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Back
          </Button>
          <Button type="submit" disabled={loading || (!verificationCode)}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
