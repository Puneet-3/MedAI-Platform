import assert from "node:assert/strict";
const base = process.env.SMOKE_URL || "http://localhost:3000";
const checks = [
  ["/", 200], ["/login", 200], ["/register", 200], ["/a-page-that-does-not-exist", 404],
  ["/api/consultations", 401], ["/api/reports", 401], ["/api/doctor/dashboard", 401],
  ["/api/admin/users", 401], ["/api/reports/nonexistent/file", 401], ["/uploads/legacy.png", 403],
];
for (const [path, expected] of checks) {
  const res = await fetch(base + path, { signal: AbortSignal.timeout(60000) });
  assert.equal(res.status, expected, path);
  if (path === "/register") {
    const html = await res.text();
    assert.match(html, /<select\b[^>]*id="register-role"/, "Role choice belongs on registration");
    assert.match(html, /<option value="USER"[^>]*>Patient<\/option>/);
    assert.match(html, /<option value="DOCTOR"[^>]*>Doctor<\/option>/);
    assert.match(html, /<option value="ADMIN"[^>]*>Administrator<\/option>/);
  }
  if (path === "/login") {
    const html = await res.text();
    assert.match(html, /<select\b[^>]*id="login-role"[^>]*required/);
    for (const [role, label] of [["USER", "Patient"], ["DOCTOR", "Doctor"], ["ADMIN", "Administrator"]]) {
      assert.ok(html.includes(`<option value="${role}">${label}</option>`), `${label} sign-in choice is missing`);
    }
  }
  console.log(`PASS ${path}: ${res.status}`);
}
for (const path of ["/dashboard", "/doctor/dashboard", "/doctor-registration", "/admin"]) {
  const res = await fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(60000) });
  assert.equal(res.status, 307, path);
  assert.match(res.headers.get("location"), /login/);
  console.log(`PASS ${path}: sign-in required`);
}
const invalid = await fetch(base + "/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Test", email: "invalid", password: "short", role: "ADMIN" }) });
assert.equal(invalid.status, 400);
console.log("PASS invalid registration rejected before database access");
const account = await fetch(base + "/account", { redirect: "manual" });
assert.ok(account.status === 307 || (account.status === 200 && /NEXT_REDIRECT.*login|http-equiv="refresh"[^>]*login/.test(await account.text())), "Account redirects to sign in");
console.log("PASS /account: sign-in required");
console.log(`${checks.length + 6} smoke checks passed.`);
