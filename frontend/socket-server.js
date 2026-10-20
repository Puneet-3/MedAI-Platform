/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS server. */
const { createServer } = require("node:http");
const { createHmac, timingSafeEqual } = require("node:crypto");
const { Server } = require("socket.io");
const { PrismaClient } = require("./app/generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv").config({ quiet: true });

const secret = process.env.SOCKET_SECRET || process.env.AUTH_SECRET;
if (!secret) throw new Error("Set SOCKET_SECRET or AUTH_SECRET before starting chat.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const server = createServer((req, res) => {
  res.writeHead(req.url === "/health" ? 200 : 404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: req.url === "/health" ? "ok" : "not found" }));
});
const io = new Server(server, {
  cors: { origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").map(value => value.trim().replace(/^["']|["']$/g, "").replace(/\/$/, "")) },
  maxHttpBufferSize: 16384,
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length > 2048) throw new Error();
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) throw new Error();
    const expected = createHmac("sha256", secret).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error();
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!Number.isFinite(claims.exp) || claims.exp <= Date.now()) throw new Error();
    const room = await prisma.consultation.findUnique({ where: { id: claims.consultationId } });
    if (!room || room.status !== "ACTIVE" || ![room.patientId, room.doctorId].includes(claims.userId)) throw new Error();
    socket.data = claims;
    next();
  } catch {
    next(new Error("Unable to join this consultation. Refresh the page and try again."));
  }
});

io.on("connection", socket => {
  const { consultationId, userId } = socket.data;
  socket.join(consultationId);
  socket.on("message_saved", async (data, acknowledge) => {
    const reply = typeof acknowledge === "function" ? acknowledge : () => {};
    try {
      if (socket.data.exp <= Date.now() || typeof data?.messageId !== "string" || data.messageId.length > 64) return reply({ error: "Invalid message notification." });
      const message = await prisma.message.findUnique({
        where: { id: data.messageId },
        include: { sender: { select: { id: true, name: true, role: true } }, consultation: { select: { status: true } } },
      });
      if (!message || message.consultationId !== consultationId || message.senderId !== userId || message.consultation.status !== "ACTIVE") return reply({ error: "Message notification is not permitted." });
      const savedMessage = { id: message.id, consultationId, senderId: message.senderId, content: message.content, createdAt: message.createdAt, sender: message.sender };
      io.to(consultationId).emit("receive_message", savedMessage);
      reply({ success: true });
    } catch {
      reply({ error: "Live notification unavailable." });
      console.error("Live message notification unavailable; the saved conversation remains available.");
    }
  });
  socket.on("send_message", async (data, acknowledge) => {
    const reply = typeof acknowledge === "function" ? acknowledge : () => {};
    try {
      const content = typeof data?.content === "string" ? data.content.trim() : "";
      if (!content || content.length > 4000 || data.consultationId !== consultationId) {
        return reply({ error: "Please keep your message between 1 and 4,000 characters." });
      }
      if (socket.data.exp <= Date.now()) return reply({ error: "Your chat session expired. Refresh the page to continue." });
      if (Date.now() - (socket.data.lastSent || 0) < 500) return reply({ error: "Please wait a moment before sending another message." });
      socket.data.lastSent = Date.now();
      const message = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM consultations WHERE id = ${consultationId} FOR UPDATE`;
        const room = await tx.consultation.findUnique({ where: { id: consultationId } });
        if (!room || room.status !== "ACTIVE" || ![room.patientId, room.doctorId].includes(userId)) throw new Error("closed");
        return tx.message.create({
          data: { consultationId, senderId: userId, content },
          include: { sender: { select: { id: true, name: true, role: true } } },
        });
      });
      io.to(consultationId).emit("receive_message", message);
      reply({ success: true });
    } catch {
      reply({ error: "Your message wasn't sent. The consultation may have ended. Please refresh and try again." });
    }
  });
});

server.listen(Number(process.env.PORT || process.env.SOCKET_PORT || 3001), "0.0.0.0", () => console.log("Consultation chat is ready."));
async function shutdown() {
  io.close();
  await prisma.$disconnect();
  await pool.end();
  server.close();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
