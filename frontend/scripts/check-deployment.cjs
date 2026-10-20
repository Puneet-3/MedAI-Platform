/* eslint-disable @typescript-eslint/no-require-imports -- Standalone deployment diagnostic. */
const { resolve } = require("node:path");
require("dotenv").config({ path: resolve(__dirname, "../.env"), quiet: true });
const problems = [];
const required = ["DATABASE_URL", "AUTH_SECRET", "FASTAPI_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of required) if (!process.env[key]) problems.push(`${key} is missing`);
if (!process.env.SOCKET_SECRET) problems.push("Set a dedicated SOCKET_SECRET on both the website and chat host");
for (const key of ["AUTH_URL", "FASTAPI_URL", "NEXT_PUBLIC_SOCKET_URL", "SUPABASE_URL"]) {
  try {
    const url = new URL(process.env[key] || "");
    if (url.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error();
  } catch { problems.push(`${key} must be the public HTTPS address`); }
}
if (process.env.NEXT_PUBLIC_REPORT_MAX_MB && Number(process.env.NEXT_PUBLIC_REPORT_MAX_MB) > 4) problems.push("Vercel report uploads must be limited to 4 MB");
if (problems.length) {
  console.log("Deployment settings still needed (no secret values are shown):");
  for (const problem of problems) console.log(`- ${problem}`);
  process.exitCode = 1;
} else console.log("Website deployment settings are present. Verify the private storage bucket and the live prediction/chat health endpoints before publishing.");
