import { authenticator } from 'otplib';
import * as crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from './prisma';

// Configure authenticator
authenticator.options = {
  window: 1, // ±1 step tolerance for clock skew
  step: 30, // 30-second time step
};

/**
 * Generate a new MFA secret for a user
 */
export async function generateMfaSecret(userId: string, email: string) {
  const secret = authenticator.generateSecret(); // Base32-encoded string
  const otpauth = authenticator.keyuri(email, 'PHRM-Diag', secret);
  
  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  
  // Store secret in database (encrypted in a real production app)
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: secret },
  });
  
  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex')
  );
  
  // Store hashed backup codes
  const hashedBackupCodes = backupCodes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: JSON.stringify(hashedBackupCodes),
    },
  });
  
  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify MFA token for a user
 */
export async function verifyMfaToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true, mfaBackupCodes: true },
  });
  
  if (!user || !user.mfaSecret) {
    return false;
  }
  
  // Check if token matches TOTP
  const isValid = authenticator.verify({ token, secret: user.mfaSecret });
  
  if (isValid) {
    return true;
  }
  
  // Check if token is a backup code
  if (user.mfaBackupCodes) {
    const backupCodes = JSON.parse(user.mfaBackupCodes) as string[];
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const backupCodeIndex = backupCodes.findIndex(code => code === hashedToken);
    
    if (backupCodeIndex >= 0) {
      // Remove used backup code
      backupCodes.splice(backupCodeIndex, 1);
      
      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: JSON.stringify(backupCodes) },
      });
      
      return true;
    }
  }
  
  return false;
}

/**
 * Enable MFA for a user
 */
export async function enableMfa(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });
}

/**
 * Disable MFA for a user
 */
export async function disableMfa(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
    },
  });
}

/**
 * Check if a user has MFA enabled
 */
export async function hasMfaEnabled(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });
  
  return user?.mfaEnabled ?? false;
}
