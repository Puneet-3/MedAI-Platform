import { createHmac } from "node:crypto";

// Room-scoped credentials avoid sending the session cookie to another service.
export function createSocketToken(userId: string, consultationId: string) {
  const secret = process.env.SOCKET_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("A socket signing secret is required.");
  const payload = Buffer.from(JSON.stringify({ userId, consultationId, exp: Date.now() + 30 * 60_000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
