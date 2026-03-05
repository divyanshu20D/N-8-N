import crypto from "crypto";

const SHA256_PREFIX = "sha256:";

const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

export const hashWebhookToken = (token: string) => {
  return `${SHA256_PREFIX}${sha256Hex(token)}`;
};

export const isHashedWebhookToken = (value: string) => {
  return value.startsWith(SHA256_PREFIX) && value.length > SHA256_PREFIX.length;
};

const timingSafeEqual = (a: string, b: string) => {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const verifyWebhookToken = ({
  providedToken,
  storedToken,
}: {
  providedToken: string;
  storedToken: string;
}) => {
  if (!providedToken || !storedToken) return false;

  if (isHashedWebhookToken(storedToken)) {
    const storedDigest = storedToken.slice(SHA256_PREFIX.length);
    const providedDigest = sha256Hex(providedToken);
    return timingSafeEqual(providedDigest, storedDigest);
  }

  return timingSafeEqual(providedToken, storedToken);
};
