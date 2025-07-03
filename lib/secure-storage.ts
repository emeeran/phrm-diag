import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAuditLog } from "./audit";
import { encrypt, decrypt } from "./encryption";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Default bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "phrm-diag-documents";

// Encryption key for client-side encryption
const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || "secure-file-encryption-key-should-be-in-env";

/**
 * Encrypts file buffer before uploading
 */
function encryptBuffer(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // Prepend IV to encrypted data
  return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypts file buffer after downloading
 */
function decryptBuffer(buffer: Buffer): Buffer {
  const iv = buffer.subarray(0, 16);
  const encryptedData = buffer.subarray(16);
  
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
}

/**
 * Uploads a file to S3 with client-side encryption
 */
export async function uploadEncryptedFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
  metadata: Record<string, string> = {}
): Promise<string> {
  // Generate unique file key
  const fileId = uuidv4();
  const fileKey = `${userId}/${fileId}-${fileName}`;
  
  // Encrypt the buffer
  const encryptedBuffer = encryptBuffer(buffer);
  
  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: encryptedBuffer,
      ContentType: mimeType,
      Metadata: {
        ...metadata,
        encrypted: "true",
        userId,
      },
    })
  );
  
  // Create audit log
  await createAuditLog({
    userId,
    action: "document_uploaded",
    resourceType: "document",
    resourceId: fileId,
    description: `Uploaded encrypted file: ${fileName}`,
  });
  
  return fileKey;
}

/**
 * Downloads and decrypts a file from S3
 */
export async function downloadEncryptedFile(
  fileKey: string,
  userId: string
): Promise<{ buffer: Buffer; contentType: string }> {
  // Download from S3
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })
  );
  
  // Check if the file is owned by the user
  if (response.Metadata?.userId !== userId) {
    throw new Error("Unauthorized access to file");
  }
  
  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  
  // Decrypt the buffer
  const decryptedBuffer = decryptBuffer(buffer);
  
  // Create audit log
  await createAuditLog({
    userId,
    action: "document_downloaded",
    resourceType: "document",
    resourceId: fileKey.split("/")[1].split("-")[0],
    description: `Downloaded encrypted file: ${fileKey.split("/")[1].split("-").slice(1).join("-")}`,
  });
  
  return {
    buffer: decryptedBuffer,
    contentType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Deletes a file from S3
 */
export async function deleteFile(fileKey: string, userId: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })
  );
  
  // Create audit log
  await createAuditLog({
    userId,
    action: "document_deleted",
    resourceType: "document",
    resourceId: fileKey.split("/")[1].split("-")[0],
    description: `Deleted file: ${fileKey.split("/")[1].split("-").slice(1).join("-")}`,
  });
}

/**
 * Generates a pre-signed URL for a file
 */
export async function generatePresignedUrl(
  fileKey: string,
  userId: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  
  // Create audit log
  await createAuditLog({
    userId,
    action: "document_downloaded",
    resourceType: "document",
    resourceId: fileKey.split("/")[1].split("-")[0],
    description: `Generated pre-signed URL for file: ${fileKey.split("/")[1].split("-").slice(1).join("-")}`,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
