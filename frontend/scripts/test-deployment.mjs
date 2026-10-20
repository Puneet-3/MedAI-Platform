import assert from "node:assert/strict";
import test from "node:test";
import { saveReport, reportDownloadUrl } from "../lib/report-storage.ts";

test("cloud report storage refuses a local-filesystem fallback", async () => {
  process.env.VERCEL = "1";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  await assert.rejects(saveReport(Buffer.from("%PDF-test"), "pdf"), /cloud report storage is not configured/);
  delete process.env.VERCEL;
});

test("private report URLs expire and cannot redirect to an unrelated host", async () => {
  process.env.SUPABASE_URL = "https://storage.example.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-test-key";
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://storage.example.invalid/storage/v1/object/sign/medical-reports/test.pdf");
      assert.equal(JSON.parse(options.body).expiresIn, 60);
      return new Response(JSON.stringify({ signedURL: "/object/sign/medical-reports/test.pdf?token=synthetic" }));
    };
    assert.equal(await reportDownloadUrl("supabase:test.pdf"), "https://storage.example.invalid/storage/v1/object/sign/medical-reports/test.pdf?token=synthetic");
    globalThis.fetch = async () => new Response(JSON.stringify({ signedURL: "https://unrelated.example.invalid/report.pdf" }));
    await assert.rejects(reportDownloadUrl("supabase:test.pdf"), /Invalid download response/);
    await assert.rejects(reportDownloadUrl("supabase:../test.pdf"), /Invalid storage reference/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("cloud and local report limits are consistent and invalid limits fall back safely", async () => {
  process.env.NEXT_PUBLIC_REPORT_MAX_MB = "4";
  const cloud = await import("../lib/report-limits.ts?cloud");
  assert.equal(cloud.REPORT_MAX_MB, 4);
  assert.equal(cloud.REPORT_MAX_BYTES, 4 * 1024 * 1024);
  delete process.env.NEXT_PUBLIC_REPORT_MAX_MB;
  assert.equal((await import("../lib/report-limits.ts?local")).REPORT_MAX_MB, 10);
  process.env.NEXT_PUBLIC_REPORT_MAX_MB = "invalid";
  assert.equal((await import("../lib/report-limits.ts?invalid")).REPORT_MAX_MB, 10);
  delete process.env.NEXT_PUBLIC_REPORT_MAX_MB;
});
