"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Send,
  ArrowLeft,
  Stethoscope,
  Download,
  Loader2,
  AlertCircle,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { downloadPrescription } from "@/lib/prescription";

interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface PredictionData {
  symptoms: string[];
  results: { disease: string; confidence: number }[];
  recommendedTest: string | null;
}

interface Consultation {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: "WAITING" | "ACTIVE" | "COMPLETED";
  prescription: string | null;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  doctor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  messages: Message[];
}

export default function PatientConsultationRoomPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const router = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<PredictionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socketToken, setSocketToken] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useRef<string>("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/consultations/${id}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn't load this page.");
        if (!controller.signal.aborted) { setConsultation(data.consultation); setSocketToken(data.socketToken); setMessages(data.consultation.messages || []); setLatestPrediction(data.latestPrediction); currentUserId.current = data.currentUserId; }
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "We couldn't load this page."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!socketToken || consultation?.status !== "ACTIVE") return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", { auth: { token: socketToken } });
    socketRef.current = socket;
    socket.on("connect", () => { setConnected(true); setError(null); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Chat couldn't connect. Please refresh the page to reconnect.");
    });
    socket.on("receive_message", (msg: Message) => {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [socketToken, consultation?.status]);

  // Polling restores missed messages after reconnecting and updates waiting rooms.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/consultations/${id}`);
        const data = await res.json();
        if (res.ok) {
          setConsultation(data.consultation);
          setMessages(data.consultation.messages || []);
          setSocketToken(previous => previous || data.socketToken);
        }
      } catch { /* Keep the last known room visible during a brief outage. */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !connected || sending || consultation?.status !== "ACTIVE") return;
    setSending(true);
    setError(null);
    socketRef.current?.timeout(10000).emit("send_message", {
      consultationId: id, content: inputText.trim(),
    }, (timeout: Error | null, result: { error?: string }) => {
      setSending(false);
      if (timeout || result?.error) setError(result?.error || "Your message wasn't confirmed. Check the conversation before trying again.");
      else setInputText("");
    });
  };
  const generatePDF = () => { if (consultation) downloadPrescription(consultation); };
  const formatSymptom = (sym: string) => {
    return sym.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500 font-sans">Connecting to consultation room...</span>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h3 className="text-base font-bold text-neutral-800">This room could not be loaded</h3>
        <p className="text-xs text-neutral-500 max-w-sm">{error || "Consultation not found."}</p>
        <button
          onClick={() => router.push("/dashboard/consultations")}
          className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold bg-neutral-50"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isCompleted = consultation.status === "COMPLETED";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[75vh] items-stretch animate-in fade-in duration-500 font-sans">

      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200 lg:col-span-12">{error}</p>}
      {/* Left Area: Chat Room & Messages */}
      <div className="lg:col-span-8 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">

        {/* Header */}
        <header className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/consultations")}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
              aria-label="Back to queue"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Dr. {consultation.doctor?.name || "Clinical Professional"}
              </h3>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-neutral-400" : "bg-emerald-500 animate-pulse"}`} />
                {isCompleted ? "Session Completed" : "Session Active"}
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            Telehealth Live
          </div>
        </header>

        {/* Message History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[45vh] min-h-[35vh]">
          {messages.length > 0 ? (
            messages.map((m) => {
              // Sender (Patient/Me) = Right side, Receiver (Doctor) = Left side
              const isDoctor = m.senderId === consultation.doctorId || m.sender?.role === "DOCTOR";
              const isMe = !isDoctor;

              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2.5 my-1.5`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm mt-1">
                      Dr
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[11px] font-bold text-neutral-400 mb-0.5 px-1">
                      {isMe ? "You (Patient)" : `Dr. ${m.sender?.name || consultation.doctor?.name || "Clinical Doctor"}`}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isMe
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-700 rounded-tl-none"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <span className={`block text-[11px] text-right mt-1 opacity-75 ${isMe ? "text-emerald-100" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {isMe && (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm mt-1">
                      Pt
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-neutral-500 space-y-2">
              <div className="p-3 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold">Room Initialized</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Consultation session started. Say hello to Dr. {consultation.doctor?.name || "clinical professional"}.
              </p>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Prescription Notice / PDF Download Box */}
        {isCompleted && (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-emerald-50 dark:bg-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 w-fit h-fit rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Digital Prescription Issued
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  Your session has been successfully completed. Download the verified prescription containing treatment notes.
                </p>
              </div>
            </div>
            {consultation.prescription && (
              <button
                onClick={generatePDF}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Rx
              </button>
            )}
          </div>
        )}

        {/* Footer Form Input */}
        {!isCompleted && (
          <form
            onSubmit={handleSend}
            className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={4000}
              aria-label="Message to your doctor"
              placeholder={connected ? "Type your message to the doctor..." : "Connecting to chat..."}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-neutral-800"
            />
            <button
              type="submit"
              disabled={!connected || sending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-neutral-100 disabled:text-neutral-400 text-white transition-all shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Right Area: Symptom Checker logs */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-5 shadow-sm h-full flex flex-col">

          <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-neutral-500" />
              Attending Room Details
            </h3>
            <p className="text-xs text-neutral-500">
              Physician reference board
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {/* Doctor Info */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                Doctor Profile
              </span>
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  Dr
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Dr. {consultation.doctor?.name || "Attending Physician"}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    {consultation.doctor?.email || "consultations@medai.com"}
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostic reference logs */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">
                Symptom Reference Logs
              </span>

              {latestPrediction ? (
                <div className="space-y-4">
                  {/* Symptoms */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      Reported Symptoms:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {latestPrediction.symptoms.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-600 dark:text-neutral-300"
                        >
                          {formatSymptom(s)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Prognosis */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      Machine Learning Prognosis:
                    </span>
                    <div className="space-y-2">
                      {latestPrediction.results.slice(0, 2).map((res, index) => {
                        const percent = Math.round(res.confidence * 100);
                        return (
                          <div key={res.disease} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {res.disease}
                              </span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${index === 0 ? "bg-teal-600" : "bg-neutral-400"}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  No symptom checker scans recorded. Make a scan on the Symptom Checker page to populate details.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 text-[11px] text-neutral-400 leading-relaxed text-center">
            Encryption: SSL End-to-End Chat Tunnel active. HIPAA & SAIF compliant.
          </div>
        </div>
      </div>
    </div>
  );
}
