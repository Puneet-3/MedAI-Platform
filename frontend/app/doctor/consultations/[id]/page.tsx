"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Send,
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  MessageSquare,
  Activity,
  CheckSquare,
  Lock
} from "lucide-react";

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

export default function DoctorConsultationRoomPage({
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
  const [prescription, setPrescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
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
        if (!controller.signal.aborted) { setConsultation(data.consultation); setSocketToken(data.socketToken); setMessages(data.consultation.messages || []); setLatestPrediction(data.latestPrediction); currentUserId.current = data.currentUserId; setPrescription(data.consultation.prescription || ""); }
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
  const handleCompleteSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription.trim() || !consultation) return;

    setSubmitLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescription: prescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete consultation.");

      // Go back to doctor dashboard
      router.push("/doctor/dashboard");
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "An error occurred.");
      setSubmitLoading(false);
    }
  };

  const formatSymptom = (sym: string) => {
    return sym.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
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
          onClick={() => router.push("/doctor/dashboard")}
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

      {error && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 lg:col-span-12">{error}</p>}
      {/* Left Column: Chat Room & Messages */}
      <div className="lg:col-span-8 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">

        {/* Header */}
        <header className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/doctor/dashboard")}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Patient: {consultation.patient.name || "Anonymous Patient"}
              </h3>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-neutral-400" : "bg-teal-500 animate-pulse"}`} />
                {isCompleted ? "Consultation Completed" : "Consultation Active"}
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
            Attending Doctor Portal
          </div>
        </header>

        {/* Message History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[40vh] min-h-[30vh]">
          {messages.length > 0 ? (
            messages.map((m) => {
              // Sender (Doctor/Me) = Right side, Receiver (Patient) = Left side
              const isPatient = m.senderId === consultation.patientId || m.sender?.role === "USER";
              const isMe = !isPatient;

              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2.5 my-1.5`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm mt-1">
                      Pt
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <span className="text-[11px] font-bold text-neutral-400 mb-0.5 px-1">
                      {isMe ? "You (Doctor)" : (m.sender?.name || consultation.patient.name || "Patient")}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isMe
                          ? "bg-teal-600 text-white rounded-tr-none"
                          : "bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-700 rounded-tl-none"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <span className={`block text-[11px] text-right mt-1 opacity-75 ${isMe ? "text-teal-100" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {isMe && (
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm mt-1">
                      Dr
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
                Consultation session started. Take active histories and review symptoms on the right panel.
              </p>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Prescription Completed Notice */}
        {isCompleted && (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-center space-y-2 text-neutral-500">
            <Lock className="w-6 h-6 mx-auto text-neutral-400" />
            <h4 className="text-xs font-bold">Session Locked</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              This telehealth consultation room is closed. The prescription has been issued and can be viewed in history.
            </p>
          </div>
        )}

        {/* Footer Chat Input */}
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
              aria-label="Message to patient"
              placeholder={connected ? "Type your message to the patient..." : "Connecting to chat..."}
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

      {/* Right Column: Reference panel & Prescription Box */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Prescription Form */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-neutral-500" />
              Prescription Console
            </h3>
            <p className="text-xs text-neutral-500">
              Document clinical findings & Rx
            </p>
          </div>

          <form onSubmit={handleCompleteSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">
                Treatment Plan & Notes
              </label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                disabled={isCompleted}
                rows={5}
                placeholder="Record your assessment, treatment plan, follow-up, and any prescribed medicines."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-neutral-800 placeholder-neutral-400 disabled:cursor-not-allowed"
                required
              />
            </div>

            {!isCompleted && (
              <button
                type="submit"
                disabled={submitLoading || !prescription.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/10"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Issuing Prescription...
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Complete & Issue Rx
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Patient Symptoms Reference */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col gap-4">
          <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-neutral-500" />
              Patient Diagnostic History
            </h3>
            <p className="text-xs text-neutral-500">
              Symptom checker ML reports
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {latestPrediction ? (
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    Machine Learning Prognosis:
                  </span>
                  <div className="space-y-2">
                    {latestPrediction.results.slice(0, 3).map((res, index) => {
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

                {latestPrediction.recommendedTest && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-xl">
                    <span className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                      Suggested Diagnostic Test
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-semibold">
                      {latestPrediction.recommendedTest}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">
                No symptom checker logs found for this patient.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
