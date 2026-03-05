import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getSecretKey = () => {
  const rawSecret = process.env.CRYPTO_SECRET || process.env.JWT_SECRET;
  if (!rawSecret) {
    throw new Error(
      "CRYPTO_SECRET is missing. Set CRYPTO_SECRET in environment variables.",
    );
  }
  return crypto.createHash("sha256").update(rawSecret).digest();
};

export const encryptObject = (data: Record<string, unknown>): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);
  const encrypted =
    cipher.update(plaintext, "utf8", "base64") + cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
};

export const decryptObject = (encryptedPayload: string): Record<string, unknown> => {
  const [ivBase64, authTagBase64, contentBase64] = encryptedPayload.split(":");

  if (!ivBase64 || !authTagBase64 || !contentBase64) {
    throw new Error("Invalid encrypted credential payload");
  }

  const key = getSecretKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivBase64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted =
    decipher.update(contentBase64, "base64", "utf8") + decipher.final("utf8");
  const parsed = JSON.parse(decrypted);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Decrypted credential data is not a valid object");
  }

  return parsed as Record<string, unknown>;
};
