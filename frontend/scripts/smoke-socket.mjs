import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { io } from "socket.io-client";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const secret = process.env.SOCKET_SECRET || process.env.AUTH_SECRET;
assert.ok(secret, "Set the socket signing secret before testing");
const payload = Buffer.from(JSON.stringify({ userId: "test", consultationId: "test", exp: Date.now() - 1000 })).toString("base64url");
const expired = payload + "." + createHmac("sha256", secret).update(payload).digest("base64url");
for (const [label, token] of [["missing", undefined], ["malformed", "invalid"], ["forged", payload + ".forged"], ["expired", expired]]) {
  const rejected = await new Promise((resolve, reject) => {
    const socket = io(`http://localhost:${process.env.SOCKET_PORT || 3001}`, { auth: { token }, reconnection: false, timeout: 5000 });
    socket.on("connect", () => { socket.disconnect(); resolve(false); });
    socket.on("connect_error", error => {
      socket.disconnect();
      if (!error.message.includes("Unable to join")) reject(new Error("Socket service is unavailable; start npm run socket first."));
      else resolve(true);
    });
  });
  assert.equal(rejected, true, label + " credentials must be rejected");
  console.log(`PASS ${label} credentials rejected`);
}
console.log("4 consultation socket authentication checks passed.");
