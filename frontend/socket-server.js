const { createServer } = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("./app/generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const server = createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join_room", ({ consultationId }) => {
    socket.join(consultationId);
    console.log(`Socket ${socket.id} joined room ${consultationId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const savedMsg = await prisma.message.create({
        data: {
          consultationId: data.consultationId,
          senderId: data.senderId,
          content: data.content
        },
        include: {
          sender: {
            select: {
              name: true,
              role: true
            }
          }
        }
      });
      io.to(data.consultationId).emit("receive_message", savedMsg);
    } catch (err) {
      console.error("Error saving socket message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
