import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createConnection } from "node:net";
import dotenv from "dotenv";
const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backend = resolve(frontend, "../fastapi");
dotenv.config({ path: resolve(frontend, ".env"), quiet: true });
for (const key of ["DATABASE_URL", "AUTH_SECRET", "FASTAPI_SECRET"]) {
  if (!process.env[key]) throw new Error(`Set ${key} in frontend/.env before starting.`);
}
const socketPort = Number(process.env.SOCKET_PORT || 3001);
async function available(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => resolve(true));
    socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
  });
}
for (const port of [3000, socketPort, 8080]) {
  if (!await available(port)) throw new Error(`Port ${port} is already in use. Stop the existing MedAI service first.`);
}
const venv = resolve(backend, process.platform === "win32" ? "venv/Scripts/python.exe" : "venv/bin/python");
const python = process.env.PYTHON || (existsSync(venv) ? venv : process.platform === "win32" ? "python" : "python3");
const jobs = [
  [process.execPath, ["node_modules/next/dist/bin/next", "dev"], frontend],
  [process.execPath, ["socket-server.js"], frontend],
  [python, ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8080"], backend],
];
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
for (const [command, args, cwd] of jobs) {
  const child = spawn(command, args, { cwd, stdio: "inherit", windowsHide: true });
  children.push(child);
  child.on("error", error => { console.error(error.message); stop(1); });
  child.on("exit", code => { if (!stopping) stop(code || 1); });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
console.log("Starting MedAI: web :3000, chat :" + socketPort + ", inference :8080. Press Ctrl+C to stop.");
