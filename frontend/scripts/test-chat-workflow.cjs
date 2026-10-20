/* eslint-disable @typescript-eslint/no-require-imports -- Standalone integration runner. */
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../app/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { io } = require("socket.io-client");
require("dotenv").config({ quiet: true });

const base = process.env.SMOKE_URL || "http://localhost:3010";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const ids = [];
const sockets = [];
let roomId;
let checks = 0;
const pass = message => { checks++; console.log(`PASS ${message}`); };

function browser() {
  const cookies = new Map();
  return async (path, options = {}) => {
    const headers = new Headers(options.headers);
    if (cookies.size) headers.set("Cookie", [...cookies].map(([key, value]) => `${key}=${value}`).join("; "));
    const response = await fetch(base + path, { ...options, headers, redirect: "manual", signal: AbortSignal.timeout(60000) });
    for (const cookie of response.headers.getSetCookie()) {
      const [first] = cookie.split(";");
      const separator = first.indexOf("=");
      cookies.set(first.slice(0, separator), first.slice(separator + 1));
    }
    return response;
  };
}

async function login(user, password) {
  const client = browser();
  const { csrfToken } = await (await client("/api/auth/csrf")).json();
  const response = await client("/api/auth/callback/credentials", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
    body: new URLSearchParams({ csrfToken, email: user.email, password, role: user.role, callbackUrl: base + "/dashboard" }),
  });
  const result = await response.json();
  assert.ok(result.url && !new URL(result.url).searchParams.has("error"), "Synthetic user sign-in failed");
  return client;
}

async function post(client, path, body, expected = 200) {
  const response = await client(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  assert.equal(response.status, expected, data.error || path);
  return data;
}

async function run() {
  const runId = randomUUID();
  const password = randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(password, 10);
  const users = [];
  for (const role of ["USER", "DOCTOR", "USER"]) {
    const user = await db.user.create({ data: { email: `chat-test-${runId}-${users.length}@example.invalid`, name: `Synthetic chat test ${runId}`, role, passwordHash } });
    ids.push(user.id);
    users.push(user);
  }
  const [patient, doctor, outsider] = await Promise.all(users.map(user => login(user, password)));
  pass("patient, doctor, and unrelated patient can sign in");
  const room = await db.consultation.create({ data: { patientId: users[0].id, doctorId: users[1].id, status: "ACTIVE" } });
  roomId = room.id;
  const path = `/api/consultations/${room.id}/messages`;
  const payload = { content: "Synthetic patient message", clientMessageId: randomUUID(), senderId: users[2].id };
  await post(browser(), path, payload, 401);
  await post(outsider, path, payload, 403);
  await post(patient, path, { content: "", clientMessageId: randomUUID() }, 400);
  pass("anonymous users, outsiders, and empty messages are rejected");
  const [first, repeated] = await Promise.all([post(patient, path, payload), post(patient, path, payload)]);
  assert.equal(first.message.id, repeated.message.id);
  assert.equal(first.message.senderId, users[0].id);
  assert.equal(await db.message.count({ where: { consultationId: roomId } }), 1);
  await post(patient, path, { ...payload, content: "Changed content" }, 409);
  pass("concurrent retries save once and cannot impersonate another sender");
  const reply = await post(doctor, path, { content: "Synthetic doctor reply", clientMessageId: randomUUID() });
  assert.equal(reply.message.senderId, users[1].id);
  const history = await (await patient(`/api/consultations/${roomId}`)).json();
  assert.equal(history.consultation.messages.length, 2);
  pass("both participants send and read saved messages without a socket connection");

  if (process.env.TEST_SOCKET_URL) {
    for (const client of [patient, doctor]) {
      const details = await (await client(`/api/consultations/${roomId}`)).json();
      const socket = io(process.env.TEST_SOCKET_URL, { transports: ["websocket"], auth: { token: details.socketToken }, reconnection: false, timeout: 10000 });
      sockets.push(socket);
      await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
    }
    const notification = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Saved message was not broadcast")), 10000);
      sockets[1].once("receive_message", message => { clearTimeout(timer); resolve(message); });
    });
    const acknowledgement = new Promise((resolve, reject) => {
      sockets[0].timeout(5000).emit("message_saved", { messageId: first.message.id, content: "Forged replacement" }, (error, result) => error ? reject(new Error("Notification handler did not acknowledge")) : resolve(result));
    });
    const [acknowledged, notified] = await Promise.all([acknowledgement, notification]);
    assert.equal(acknowledged.success, true, acknowledged.error);
    assert.equal(notified.content, payload.content);
    pass("live notifications read the saved record instead of trusting client text");
  }

  const prediction = await post(patient, "/api/predict", { symptoms: ["cough", "high_fever"] });
  assert.ok(prediction.id && prediction.results.length === 3);
  pass("real symptom prediction is returned and saved");
  await db.consultation.update({ where: { id: roomId }, data: { status: "COMPLETED" } });
  await post(patient, path, { content: "After closure", clientMessageId: randomUUID() }, 409);
  await post(patient, path, payload);
  pass("closed rooms reject new messages while safe retries return the original record");
  console.log(`${checks} chat and prediction workflow checks passed.`);
}

run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  for (const socket of sockets) socket.disconnect();
  if (roomId) await db.consultation.deleteMany({ where: { id: roomId, patientId: { in: ids } } });
  if (ids.length) await db.user.deleteMany({ where: { id: { in: ids }, email: { endsWith: "@example.invalid" } } });
  await db.$disconnect();
  await pool.end();
});
