import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { basename, join } from "node:path";

const directory = join(process.cwd(), "storage", "reports");
const bucket = "medical-reports";
const mimeTypes: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg" };

export function reportExtension(bytes: Buffer): string | null {
  if (bytes.subarray(0, 5).toString() === "%PDF-") return "pdf";
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  return null;
}

function storage() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export async function saveReport(bytes: Buffer, extension: string) {
  const name = `${randomUUID()}.${extension}`;
  const remote = storage();
  if (remote) {
    const res = await fetch(`${remote.url}/storage/v1/object/${bucket}/${name}`, {
      method: "POST", headers: { Authorization: `Bearer ${remote.key}`, "Content-Type": mimeTypes[extension] },
      body: new Uint8Array(bytes), signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error("Storage upload failed");
    return `supabase:${name}`;
  }
  if (process.env.VERCEL) throw new Error("Private cloud report storage is not configured.");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), bytes, { flag: "wx" });
  return `local:${name}`;
}

export async function reportDownloadUrl(reference: string): Promise<string | null> {
  const { provider, name } = locate(reference);
  if (provider !== "supabase") return null;
  const remote = storage();
  if (!remote) throw new Error("Storage isn't configured");
  const res = await fetch(`${remote.url}/storage/v1/object/sign/${bucket}/${encodeURIComponent(name)}`, {
    method: "POST", headers: { Authorization: `Bearer ${remote.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 60 }), cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error("Unable to retrieve report");
  const result = await res.json();
  const path = result.signedURL;
  if (typeof path !== "string" || !path.startsWith(`/object/sign/${bucket}/`)) throw new Error("Invalid download response");
  return `${remote.url}/storage/v1${path}`;
}

function locate(reference: string) {
  if (reference.startsWith("local:") || reference.startsWith("supabase:")) {
    const [provider, name] = reference.split(":");
    if (!name || basename(name) !== name || !/^[a-zA-Z0-9_-]+\.(pdf|png|jpg|jpeg)$/.test(name)) throw new Error("Invalid storage reference");
    return { provider, name, legacy: false };
  }
  // Existing reports remain readable through the authenticated download route.
  if (reference.startsWith("/uploads/")) {
    const name = reference.slice(9);
    if (basename(name) !== name || !/^[a-zA-Z0-9_-]+\.(pdf|png|jpg|jpeg)$/.test(name)) throw new Error("Invalid storage reference");
    return { provider: "local", name, legacy: true };
  }
  const remote = storage();
  if (remote && reference.startsWith(`${remote.url}/storage/v1/object/`)) {
    const pathname = new URL(reference).pathname;
    const marker = `/${bucket}/`;
    const name = decodeURIComponent(pathname.slice(pathname.indexOf(marker) + marker.length));
    if (!pathname.includes(marker) || basename(name) !== name) throw new Error("Invalid storage reference");
    return { provider: "supabase", name, legacy: false };
  }
  throw new Error("Unknown storage reference");
}

export async function readReport(reference: string) {
  const { provider, name, legacy } = locate(reference);
  const type = mimeTypes[name.split(".").pop() || ""] || "image/jpeg";
  if (provider === "supabase") {
    const remote = storage();
    if (!remote) throw new Error("Storage isn't configured");
    const res = await fetch(`${remote.url}/storage/v1/object/authenticated/${bucket}/${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${remote.key}` }, signal: AbortSignal.timeout(20000), cache: "no-store",
    });
    if (!res.ok) throw new Error("Unable to retrieve report");
    return { bytes: new Uint8Array(await res.arrayBuffer()), type, name };
  }
  const root = legacy ? join(process.cwd(), "public", "uploads") : directory;
  return { bytes: new Uint8Array(await readFile(join(root, name))), type, name };
}

export async function removeReport(reference: string) {
  const { provider, name } = locate(reference);
  if (provider === "local") return unlink(join(directory, name));
  const remote = storage();
  if (remote) await fetch(`${remote.url}/storage/v1/object/${bucket}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${remote.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [name] }), signal: AbortSignal.timeout(10000),
  });
}
