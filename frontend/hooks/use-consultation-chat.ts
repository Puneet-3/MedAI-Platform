"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { io, type Socket } from "socket.io-client";
import { mergeMessages, type ChatMessage } from "@/lib/chat-messages";

export function useConsultationChat({ id, status, token, setMessages }: {
  id: string;
  status: string | undefined;
  token: string | null;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}) {
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pending = useRef<{ content: string; id: string } | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!token || status !== "ACTIVE") return;
    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      // WebSocket first also avoids relying on HTTP long-polling CORS at a proxy.
      transports: ["websocket", "polling"], tryAllTransports: true, timeout: 20000,
      auth: callback => {
        fetch(`/api/consultations/${id}`, { cache: "no-store", signal: controller.signal })
          .then(response => response.ok ? response.json() : null)
          .then(data => { if (!stopped) callback({ token: data?.socketToken || token }); })
          .catch(() => { if (!stopped) callback({ token }); });
      },
    });
    socketRef.current = socket;
    socket.on("connect", () => { if (!stopped) setConnected(true); });
    socket.on("disconnect", () => { if (!stopped) setConnected(false); });
    socket.on("connect_error", () => {
      if (stopped) return;
      setConnected(false);
      // Middleware refusals do not automatically reconnect. Fetch a fresh token.
      if (!socket.active) retry = setTimeout(() => { if (!stopped) socket.connect(); }, 10000);
    });
    socket.on("receive_message", (message: ChatMessage) => {
      if (message.consultationId === id) setMessages(previous => mergeMessages(previous, [message]));
    });
    const renewal = setInterval(() => { if (!stopped) socket.disconnect().connect(); }, 25 * 60000);
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(retry);
      clearInterval(renewal);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, status, token, setMessages]);

  const sendMessage = async (content: string) => {
    if (inFlight.current || status !== "ACTIVE") return false;
    inFlight.current = true;
    setSending(true);
    // Reuse the id after an uncertain response so retrying cannot send twice.
    if (pending.current?.content !== content) pending.current = { content, id: crypto.randomUUID() };
    try {
      const response = await fetch(`/api/consultations/${id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, clientMessageId: pending.current.id }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your message could not be sent. Please try again.");
      setMessages(previous => mergeMessages(previous, [data.message]));
      // The live server reads the saved record itself; it never trusts message text from a client.
      if (socketRef.current?.connected) socketRef.current.emit("message_saved", { messageId: data.message.id });
      pending.current = null;
      return true;
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return { connected, sending, sendMessage };
}
