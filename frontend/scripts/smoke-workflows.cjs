/* eslint-disable @typescript-eslint/no-require-imports -- Standalone integration runner. */
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const { readFile, unlink } = require("node:fs/promises");
const { resolve } = require("node:path");
const { PrismaClient } = require("../app/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { io } = require("socket.io-client");
const { jsPDF } = require("jspdf");
require("dotenv").config({ quiet: true });

const base = process.env.SMOKE_URL || "http://localhost:3000";
const runId = randomUUID();
const marker = `MedAI workflow test ${runId}`;
const fixtures = new Map();
const sockets = [];
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
let passed = 0;

function pass(label) {
  console.log(`PASS ${label}`);
  passed++;
}

function browser() {
  const cookies = new Map();
  return {
    async fetch(path, options = {}) {
      const headers = new Headers(options.headers);
      if (cookies.size) headers.set("Cookie", [...cookies].map(([k, v]) => `${k}=${v}`).join("; "));
      const response = await fetch(base + path, {
        ...options, headers, redirect: "manual", signal: AbortSignal.timeout(60000),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const first = cookie.split(";")[0];
        const separator = first.indexOf("=");
        cookies.set(first.slice(0, separator), first.slice(separator + 1));
      }
      return response;
    },
  };
}

async function json(client, path, options = {}, expected = 200) {
  const response = await client.fetch(path, {
    ...options,
    ...(options.body && !(options.body instanceof FormData) ? {
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(options.body),
    } : {}),
  });
  assert.equal(response.status, expected, `${path} returned an unexpected status`);
  return response.json();
}

async function login(email, password, expectedRole = "USER", submittedRole = expectedRole) {
  const client = browser();
  const { csrfToken } = await json(client, "/api/auth/csrf");
  const response = await client.fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
    body: new URLSearchParams({ csrfToken, email, password, role: submittedRole, callbackUrl: base + "/dashboard" }),
  });
  const result = await response.json();
  assert.ok(response.ok && result.url && !new URL(result.url).searchParams.has("error"), "Credential sign-in failed");
  const session = await json(client, "/api/auth/session");
  assert.equal(session.user?.role, expectedRole, "Session has the wrong role");
  return client;
}

async function pageRedirect(client, path, destination) {
  const response = await client.fetch(path);
  if (response.status >= 300 && response.status < 400) {
    assert.equal(new URL(response.headers.get("location"), base).pathname, destination, path);
  } else {
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.ok(html.includes(destination) && (html.includes("NEXT_REDIRECT") || html.includes('http-equiv="refresh"')), `${path} must redirect to ${destination}`);
  }
}

async function register(label, role = "USER", requestedRole = "USER", invitationCode) {
  const email = `medai-test-${runId}-${label}@example.invalid`;
  const password = `Test-${randomBytes(18).toString("hex")}!`;
  const fixture = { email, password, name: `${marker} ${label}` };
  fixtures.set(email, fixture);
  const result = await json(browser(), "/api/auth/register", {
    method: "POST", body: { ...fixture, role: requestedRole, ...(invitationCode ? { invitationCode } : {}) },
  }, 201);
  fixture.id = result.userId;
  const user = await db.user.findUnique({ where: { id: fixture.id } });
  assert.equal(user.email, email);
  assert.equal(user.role, requestedRole === "ADMIN" ? "ADMIN" : "USER", "Administrator registration requires an invitation; doctor registration requires approval");
  assert.equal(user.doctorAccessRequested, requestedRole === "DOCTOR");
  assert.equal(result.doctorAccessRequested, requestedRole === "DOCTOR");
  if (role !== user.role) {
    await db.user.update({ where: { id: fixture.id, email }, data: { role } });
  }
  fixture.client = await login(email.toUpperCase(), password, role, role === "USER" && requestedRole === "DOCTOR" ? "DOCTOR" : role);
  return fixture;
}

async function connectChat(token) {
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
    auth: { token }, reconnection: false, timeout: 10000,
  });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", () => reject(new Error("The consultation socket could not authenticate")));
  });
  return socket;
}

function nextMessage(socket, content) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("receive_message", listener);
      reject(new Error("The other participant did not receive the test message"));
    }, 15000);
    function listener(message) {
      if (message.content !== content) return;
      clearTimeout(timer);
      socket.off("receive_message", listener);
      resolve(message);
    }
    socket.on("receive_message", listener);
  });
}

function sendMessage(socket, consultationId, content, senderId) {
  return new Promise((resolve, reject) => {
    socket.timeout(10000).emit("send_message", { consultationId, content, senderId }, (error, result) => {
      if (error) reject(new Error("The chat service did not acknowledge the test message"));
      else resolve(result);
    });
  });
}

async function cleanup() {
  for (const socket of sockets) socket.disconnect();
  const emails = [...fixtures.keys()];
  if (!emails.length) return;
  const users = await db.user.findMany({
    where: { email: { in: emails }, name: { startsWith: marker } },
    select: { id: true },
  });
  const ids = users.map(user => user.id);
  const reports = await db.report.findMany({ where: { userId: { in: ids } }, select: { fileUrl: true } });
  for (const report of reports) {
    const match = /^(local|supabase):([a-f0-9-]{36}\.(?:pdf|png|jpg))$/.exec(report.fileUrl);
    assert.ok(match, "Cleanup refused an unexpected report storage reference");
    if (match[1] === "local") {
      await unlink(resolve(__dirname, "../storage/reports", match[2])).catch(error => {
        if (error.code !== "ENOENT") throw error;
      });
    } else {
      assert.ok(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY, "Storage cleanup needs the configured storage credentials");
      const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/medical-reports`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [match[2]] }), signal: AbortSignal.timeout(15000),
      });
      assert.ok(response.ok, "The temporary storage object could not be removed");
    }
  }
  await db.user.deleteMany({ where: { id: { in: ids }, email: { in: emails }, name: { startsWith: marker } } });
  const remaining = await db.user.count({ where: { email: { in: emails } } });
  assert.equal(remaining, 0, "Some temporary test accounts remain");
  console.log("Temporary accounts, reports, predictions, consultations, and messages removed.");
}

async function main() {
  console.log("Testing with isolated synthetic accounts; existing accounts and records are not modified.");
  const patient = await register("patient");
  const outsider = await register("outsider");
  const doctor = await register("doctor", "DOCTOR");
  const admin = await register("admin", "ADMIN");
  pass("registration, normalized-email sign-in, and role sessions");

  const inviteEmail = `medai-test-${runId}-invited-admin@example.invalid`;
  const inviteFixture = { email: inviteEmail, name: `${marker} invited-admin`, password: `Test-${randomBytes(18).toString("hex")}!` };
  fixtures.set(inviteEmail, inviteFixture);
  await json(browser(), "/api/admin/invitations", { method: "POST", body: { email: inviteEmail } }, 401);
  await json(patient.client, "/api/admin/invitations", { method: "POST", body: { email: inviteEmail } }, 401);
  await json(admin.client, "/api/admin/invitations", { method: "POST", body: { email: admin.email } }, 409);
  await json(admin.client, "/api/admin/invitations", { method: "POST", body: { email: "invalid" } }, 400);
  const invitation = await json(admin.client, "/api/admin/invitations", { method: "POST", body: { email: inviteEmail } });
  assert.equal(invitation.email, inviteEmail);
  assert.ok(Date.parse(invitation.expiresAt) > Date.now());
  await json(browser(), "/api/auth/register", { method: "POST", body: { ...inviteFixture, role: "ADMIN" } }, 403);
  const parts = invitation.invitationCode.split(".");
  const tampered = parts[0] + "." + (parts[1][0] === "A" ? "B" : "A") + parts[1].slice(1);
  await json(browser(), "/api/auth/register", { method: "POST", body: { ...inviteFixture, role: "ADMIN", invitationCode: tampered } }, 403);
  const wrongEmail = `medai-test-${runId}-wrong-invite@example.invalid`;
  fixtures.set(wrongEmail, { email: wrongEmail, name: `${marker} wrong-invite` });
  await json(browser(), "/api/auth/register", { method: "POST", body: { ...inviteFixture, name: `${marker} wrong-invite`, email: wrongEmail, role: "ADMIN", invitationCode: invitation.invitationCode } }, 403);
  assert.equal(await db.user.count({ where: { email: { in: [inviteEmail, wrongEmail] } } }), 0);
  const invitedAdmin = await register("invited-admin", "ADMIN", "ADMIN", invitation.invitationCode);
  await json(invitedAdmin.client, "/api/admin/users");
  const adminPage = await invitedAdmin.client.fetch("/admin");
  assert.equal(adminPage.status, 200);
  assert.ok(!(await adminPage.text()).includes("NEXT_REDIRECT"));
  await json(browser(), "/api/auth/register", { method: "POST", body: { email: invitedAdmin.email, name: invitedAdmin.name, password: invitedAdmin.password, role: "ADMIN", invitationCode: invitation.invitationCode } }, 409);
  pass("Administrator registration requires an authorized, email-bound invitation; forged and reused invites cannot create accounts");

  await assert.rejects(() => login(patient.email, patient.password, "USER", "DOCTOR"), /sign-in failed/);
  await assert.rejects(() => login(patient.email, patient.password, "USER", "ADMIN"), /sign-in failed/);
  await assert.rejects(() => login(doctor.email, doctor.password, "DOCTOR", "USER"), /sign-in failed/);
  await assert.rejects(() => login(admin.email, admin.password, "ADMIN", ""), /sign-in failed/);
  await assert.rejects(() => login(admin.email, admin.password, "ADMIN", "invalid-role"), /sign-in failed/);
  pass("Patient, Doctor, and Administrator sign-in choices match saved access; missing or forged roles are rejected");

  const applicant = await register("doctor-request", "USER", "DOCTOR");
  assert.equal((await json(applicant.client, "/api/auth/session")).user.doctorAccessRequested, true);
  const pendingPage = await applicant.client.fetch("/doctor-registration");
  assert.equal(pendingPage.status, 200);
  const pendingHtml = await pendingPage.text();
  assert.match(pendingHtml, /Approval pending/);
  assert.match(pendingHtml, /Your Doctor selection is saved/);
  assert.doesNotMatch(pendingHtml, /href="\/dashboard\/symptom-checker"/);
  await pageRedirect(applicant.client, "/dashboard", "/doctor-registration");
  await pageRedirect(applicant.client, "/doctor/dashboard", "/doctor-registration");
  await json(applicant.client, "/api/doctor/dashboard", {}, 401);
  await json(applicant.client, "/api/admin/users", { method: "PUT", body: { userId: applicant.id, role: "DOCTOR" } }, 401);
  const directory = await json(admin.client, "/api/admin/users");
  assert.equal(directory.users.find(user => user.id === applicant.id)?.doctorAccessRequested, true);
  const accountPage = await applicant.client.fetch("/account");
  assert.match(await accountPage.text(), /Doctor · approval pending/);
  await json(admin.client, "/api/admin/users", { method: "PUT", body: { userId: applicant.id, role: "USER" } });
  assert.equal((await db.user.findUnique({ where: { id: applicant.id } })).doctorAccessRequested, false);
  await pageRedirect(applicant.client, "/doctor-registration", "/dashboard");
  assert.equal((await json(applicant.client, "/api/auth/session")).user.role, "USER");
  const approved = await register("doctor-approval", "USER", "DOCTOR");
  await json(admin.client, "/api/admin/users", { method: "PUT", body: { userId: approved.id, role: "DOCTOR" } });
  assert.equal((await db.user.findUnique({ where: { id: approved.id } })).doctorAccessRequested, false);
  // The browser still holds its pending-role cookie at this point.
  await pageRedirect(approved.client, "/doctor-registration", "/doctor/dashboard");
  const doctorWorkspace = await approved.client.fetch("/doctor/dashboard");
  assert.equal(doctorWorkspace.status, 200);
  const workspaceHtml = await doctorWorkspace.text();
  assert.match(workspaceHtml, /Doctor workspace/);
  assert.ok(!workspaceHtml.includes("NEXT_REDIRECT"));
  assert.equal((await json(approved.client, "/api/auth/session")).user.role, "DOCTOR");
  await json(approved.client, "/api/doctor/dashboard");
  await login(approved.email, approved.password, "DOCTOR");
  await json(browser(), "/api/auth/register", { method: "POST", body: { name: "Invalid role test", email: `medai-test-${runId}-invalid@example.invalid`, password: "Testing-only-password", role: "INVALID" } }, 400);
  pass("doctor registration stays pending until administrator approval; rejection preserves patient access");

  await pageRedirect(patient.client, "/doctor/dashboard", "/unauthorized");
  await pageRedirect(patient.client, "/admin", "/unauthorized");
  await pageRedirect(patient.client, "/doctor-registration", "/dashboard");
  await pageRedirect(doctor.client, "/admin", "/unauthorized");
  pass("layouts enforce current roles and pending registration has its own interface");

  await json(browser(), "/api/auth/register", { method: "POST", body: {
    name: patient.name, email: patient.email.toUpperCase(), password: patient.password,
  } }, 409);
  await json(patient.client, "/api/doctor/dashboard", {}, 401);
  await json(patient.client, "/api/admin/users", {}, 401);
  pass("duplicate registration and cross-role access restrictions");

  await json(patient.client, "/api/account", { method: "PATCH", body: { name: patient.name + " updated" } });
  let session = await json(patient.client, "/api/auth/session");
  assert.equal(session.user.name, patient.name + " updated");
  const newPassword = `Test-${randomBytes(18).toString("hex")}!`;
  await json(patient.client, "/api/account", { method: "PATCH", body: {
    name: patient.name + " updated", currentPassword: patient.password, newPassword,
  } });
  await assert.rejects(() => login(patient.email, patient.password), /sign-in failed/);
  patient.client = await login(patient.email, newPassword);
  pass("account name update and password change through authenticated APIs");

  const prediction = await json(patient.client, "/api/predict", {
    method: "POST", body: { symptoms: ["cough", "high_fever"] },
  });
  assert.ok(prediction.id && prediction.results.length);
  const savedPrediction = await db.prediction.findUnique({ where: { id: prediction.id } });
  assert.equal(savedPrediction.userId, patient.id);
  pass("real symptom inference saved to the correct patient");

  const chat = await json(patient.client, "/api/chat", { method: "POST", body: { message: "hello" } });
  assert.ok(typeof chat.response === "string" && chat.response.length);
  pass("authenticated health assistant request");

  const pdf = new jsPDF();
  pdf.text("Synthetic MedAI workflow test. Not a medical report.", 20, 25);
  const form = new FormData();
  form.append("file", new Blob([pdf.output("arraybuffer")], { type: "application/pdf" }), "workflow-test.pdf");
  form.append("reportType", "Other Medical Report");
  const upload = await json(patient.client, "/api/upload-report", { method: "POST", body: form }, 201);
  assert.equal(upload.status, "PENDING");
  const filePath = `/api/reports/${upload.reportId}/file`;
  assert.equal((await browser().fetch(filePath)).status, 401);
  assert.equal((await outsider.client.fetch(filePath)).status, 403);
  const download = await patient.client.fetch(filePath);
  assert.equal(download.status, 200);
  assert.equal(Buffer.from(await download.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
  assert.match(download.headers.get("cache-control"), /no-store/);
  pass("report upload, authenticated PDF download, and patient isolation");

  const queue = await json(doctor.client, "/api/doctor/dashboard");
  assert.ok(queue.analyzedReports.some(report => report.id === upload.reportId), "Pending reports must reach the doctor review queue");
  const notes = "Synthetic review notes for automated testing only.";
  await json(doctor.client, `/api/doctor/reports/${upload.reportId}/review`, { method: "POST", body: { doctorNotes: notes } });
  const reports = await json(patient.client, "/api/reports");
  const reviewed = reports.reports.find(report => report.id === upload.reportId);
  assert.equal(reviewed.status, "REVIEWED");
  assert.equal(reviewed.doctorNotes, notes);
  pass("pending reports can be reviewed and the patient receives the notes");

  const xrayFiles = process.argv.slice(2).filter((_, index, args) => index > 0 && args[index - 1] === "--xray");
  if (xrayFiles.length) {
    for (const file of xrayFiles) {
      const bytes = await readFile(resolve(file));
      const xrayForm = new FormData();
      xrayForm.append("file", new Blob([bytes], { type: "image/png" }), "public-research-xray.png");
      xrayForm.append("reportType", "Chest X-Ray");
      const screened = await json(patient.client, "/api/upload-report", { method: "POST", body: xrayForm }, 201);
      assert.equal(screened.status, "ANALYZED", "The trained X-ray model did not screen the uploaded sample");
      const record = await db.report.findUnique({ where: { id: screened.reportId } });
      assert.ok(["Normal", "Pneumonia"].includes(record.cnnLabel));
      assert.ok(Number.isFinite(record.cnnConfidence) && record.cnnConfidence >= .5 && record.cnnConfidence <= 1);
      assert.equal(record.userId, patient.id);
      assert.equal(record.doctorNotes, null, "Model screening must not pretend to be a doctor's review");
      const listed = await json(patient.client, "/api/reports");
      assert.ok(listed.reports.some(report => report.id === screened.reportId && report.cnnLabel === record.cnnLabel));
      const work = await json(doctor.client, "/api/doctor/dashboard");
      assert.ok(work.analyzedReports.some(report => report.id === screened.reportId));
      await json(doctor.client, `/api/doctor/reports/${screened.reportId}/review`, {
        method: "POST", body: { doctorNotes: "Synthetic review of a public research X-ray. Not for patient use." },
      });
      assert.equal((await db.report.findUnique({ where: { id: screened.reportId } })).status, "REVIEWED");
    }
    pass("trained X-ray screening, saved model scores, patient results, and doctor review");
  }

  const requested = await json(patient.client, "/api/consultations", { method: "POST" });
  const consultationId = requested.consultationId;
  const duplicate = await json(patient.client, "/api/consultations", { method: "POST" });
  assert.equal(duplicate.consultationId, consultationId);
  await json(outsider.client, `/api/consultations/${consultationId}`, {}, 403);
  pass("consultation creation, duplicate prevention, and room access restrictions");

  const accepted = await Promise.all([0, 1].map(() => doctor.client.fetch(`/api/consultations/${consultationId}/accept`, { method: "POST" })));
  assert.equal(accepted.filter(response => response.ok).length, 1, "Only one concurrent accept request may win");
  pass("consultation acceptance is atomic under concurrent requests");

  const patientRoom = await json(patient.client, `/api/consultations/${consultationId}`);
  const doctorRoom = await json(doctor.client, `/api/consultations/${consultationId}`);
  assert.equal(patientRoom.consultation.status, "ACTIVE");
  const patientSocket = await connectChat(patientRoom.socketToken);
  const doctorSocket = await connectChat(doctorRoom.socketToken);
  const message = `Synthetic patient message ${runId}`;
  const received = nextMessage(doctorSocket, message);
  const acknowledged = await sendMessage(patientSocket, consultationId, message, outsider.id);
  assert.equal(acknowledged.success, true);
  assert.equal((await received).senderId, patient.id, "The sender must come from the signed session, not client input");
  pass("authenticated chat delivery and rejection of sender impersonation");

  const reply = `Synthetic doctor reply ${runId}`;
  const patientReceived = nextMessage(patientSocket, reply);
  assert.equal((await sendMessage(doctorSocket, consultationId, reply, patient.id)).success, true);
  assert.equal((await patientReceived).senderId, doctor.id);
  const history = await json(patient.client, `/api/consultations/${consultationId}`);
  assert.equal(history.consultation.messages.length, 2);
  pass("doctor replies and persisted consultation message history");

  const treatment = "Synthetic consultation notes. Not a prescription for patient use.";
  await json(doctor.client, `/api/consultations/${consultationId}/complete`, { method: "POST", body: { prescription: treatment } });
  const completed = await json(patient.client, `/api/consultations/${consultationId}`);
  assert.equal(completed.consultation.status, "COMPLETED");
  assert.equal(completed.consultation.prescription, treatment);
  assert.equal(completed.socketToken, null);
  assert.ok((await sendMessage(patientSocket, consultationId, "Must not be saved after completion")).error);
  pass("consultation completion, treatment notes, and closed-room message restrictions");

  await json(admin.client, "/api/admin/users", { method: "PUT", body: { userId: outsider.id, role: "DOCTOR" } });
  session = await json(outsider.client, "/api/auth/session");
  assert.equal(session.user.role, "DOCTOR");
  await json(admin.client, "/api/admin/users", { method: "PUT", body: { userId: outsider.id, role: "USER" } });
  session = await json(outsider.client, "/api/auth/session");
  assert.equal(session.user.role, "USER");
  await json(admin.client, "/api/admin/users", { method: "PUT", body: { userId: admin.id, role: "USER" } }, 400);
  const intents = await json(admin.client, "/api/admin/intents");
  assert.ok(Array.isArray(intents.intents));
  pass("administrator role updates, live session refresh, self-protection, and assistant access");

  for (const [client, path] of [
    [patient.client, "/dashboard"], [patient.client, "/dashboard/history"],
    [patient.client, "/account"], [doctor.client, "/doctor/dashboard"], [admin.client, "/admin"],
  ]) {
    const page = await client.fetch(path);
    const body = await page.text();
    assert.equal(page.status, 200, path);
    assert.ok(!body.includes("NEXT_REDIRECT"), `${path} unexpectedly redirected`);
  }
  pass("signed-in patient, history, account, doctor, and administrator pages");
  console.log(`${passed} signed-in workflow groups passed.`);
}

(async () => {
  try {
    await main();
  } catch (error) {
    console.error("Workflow check failed:", error.message);
    process.exitCode = 1;
  } finally {
    try { await cleanup(); }
    catch (error) { console.error("Temporary test cleanup failed:", error.message); process.exitCode = 1; }
    await db.$disconnect();
    await pool.end();
  }
})();
