import { createHmac } from "crypto";

const SECRET = "d34ce0ae-16ba-4868-bf86-9fcb042d0219";

// Helper functions to sign and verify data using HMAC-SHA256
function _sign(data: string) {
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return sig;
}

/**
 * Sign data with HMAC-SHA256
 * @param data The data to sign
 * @returns The signed data in the format: data.signature
 */
function sign(data: string) {
  const sig = _sign(data);
  return data + "." + sig;
}

/**
 * Verify signed data
 * @param signedData The signed data in the format: data.signature
 * @returns The original data if the signature is valid
 * @throws Error if the signature is invalid
 */
function verify(signedData: string) {
  const parts = signedData.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid signed data format");
  }
  const data = parts[0];
  const sig = parts[1];
  const expectedSig = _sign(data);
  if (sig !== expectedSig) {
    throw new Error("Invalid signature");
  }
  return data;
}

export { sign, verify };
