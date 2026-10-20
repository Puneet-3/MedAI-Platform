import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const lifetime = 24 * 60 * 60;
const purpose = "medai:admin-registration:v1:";

function signature(payload: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Administrator invitations require AUTH_SECRET.");
  return createHmac("sha256", secret).update(purpose + payload).digest();
}

export function createAdminInvitation(email: string) {
  const expires = Math.floor(Date.now() / 1000) + lifetime;
  const payload = Buffer.from(JSON.stringify({ email, expires, nonce: randomBytes(16).toString("base64url") })).toString("base64url");
  return { invitationCode: `${payload}.${signature(payload).toString("base64url")}`, expiresAt: new Date(expires * 1000).toISOString() };
}

export function validAdminInvitation(code: unknown, email: string): boolean {
  if (typeof code !== "string" || code.length > 1024) return false;
  const parts = code.trim().split(".");
  if (parts.length !== 2 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const expected = signature(parts[0]);
    const supplied = Buffer.from(parts[1], "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
    const value = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    return value.email === email && Number.isSafeInteger(value.expires) && value.expires > now && value.expires <= now + lifetime && typeof value.nonce === "string" && value.nonce.length > 0;
  } catch { return false; }
}
