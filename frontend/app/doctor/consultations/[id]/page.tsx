"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { 
  Send, 
  ArrowLeft, 
  Stethoscope, 
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
  const [inputText, setInputText] = useState("");
  const [prescription, setPrescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = useRef<string>("");

  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`/api/consultations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load room details.");

      setConsultation(data.consultation);
      setMessages(data.consultation.messages || []);
      setLatestPrediction(data.latestPrediction);
      setPrescription(data.consultation.prescription || "");
      
      // Determine current user ID (doctor ID)
      if (data.consultation && data.consultation.doctorId) {
        currentUserId.current = data.consultation.doctorId;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load consultation session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  // Handle Socket.io connection
  useEffect(() => {
    if (loading || !consultation || consultation.status === "COMPLETED") return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit("join_room", { consultationId: id });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [loading, consultation?.status]);

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !consultation) return;

    socketRef.current.emit("send_message", {
      consultationId: id,
      senderId: currentUserId.current,
      content: inputText.trim(),
    });

    setInputText("");
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
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setSubmitLoading(false);
    }
  };

  const formatSymptom = (sym: string) => {
    return sym.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500 font-sans">Connecting to consultation room...</span>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h3 className="text-base font-bold text-neutral-850">Room Initialization Failed</h3>
        <p className="text-xs text-neutral-500 max-w-sm">{error || "Consultation not found."}</p>
        <button
          onClick={() => router.push("/doctor/dashboard")}
          className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold bg-neutral-55"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isCompleted = consultation.status === "COMPLETED";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[75vh] items-stretch animate-in fade-in duration-500 font-sans">
      
      {/* Left Column: Chat Room & Messages */}
      <div className="lg:col-span-8 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/doctor/dashboard")}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-xs font-bold text-neutral-850 dark:text-neutral-200">
                Patient: {consultation.patient.name || "Anonymous Patient"}
              </h3>
              <p className="text-[9px] text-neutral-450 dark:text-neutral-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-neutral-400" : "bg-indigo-500 animate-pulse"}`} />
                {isCompleted ? "Consultation Completed" : "Consultation Active"}
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-350">
            Attending Doctor Portal
          </div>
        </header>

        {/* Message History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[40vh] min-h-[30vh]">
          {messages.length > 0 ? (
            messages.map((m) => {
              const isMe = m.senderId === consultation.doctorId;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-indigo-55/10 text-indigo-650 flex items-center justify-center font-extrabold text-[10px] shrink-0">
                      Pt
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 rounded-tl-none"
                    }`}
                  >
                    {!isMe && (
                      <span className="block text-[8px] font-black text-indigo-750 dark:text-indigo-400 uppercase tracking-widest mb-0.5">
                        {m.sender.name} (Patient)
                      </span>
                    )}
                    <p className="leading-relaxed">{m.content}</p>
                    <span className="block text-[8px] text-right mt-1 opacity-70">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-neutral-500 space-y-2">
              <div className="p-3 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-450 mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold">Room Initialized</h4>
              <p className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                Consultation session started. Take active histories and review symptoms on the right panel.
              </p>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Prescription Completed Notice */}
        {isCompleted && (
          <div className="p-6 border-t border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 text-center space-y-2 text-neutral-500">
            <Lock className="w-6 h-6 mx-auto text-neutral-400" />
            <h4 className="text-xs font-bold">Session Locked</h4>
            <p className="text-[10px] text-neutral-450 max-w-xs mx-auto">
              This telehealth consultation room is closed. The prescription has been issued and can be viewed in history.
            </p>
          </div>
        )}

        {/* Footer Chat Input */}
        {!isCompleted && (
          <form
            onSubmit={handleSend}
            className="p-4 border-t border-neutral-200/60 dark:border-neutral-800 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type clinical notes or chat with patient..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-neutral-850"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-100 disabled:text-neutral-400 text-white transition-all shadow-sm"
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
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-neutral-500" />
              Prescription Console
            </h3>
            <p className="text-[10px] text-neutral-500">
              Document clinical findings & Rx
            </p>
          </div>

          <form onSubmit={handleCompleteSession} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest mb-1.5">
                Treatment Plan & Notes
              </label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                disabled={isCompleted}
                rows={5}
                placeholder="Rx:&#10;1. Paracetamol 650mg - TDS for 3 days&#10;2. Rest & Hydrate well&#10;&#10;Clinical Findings: Patient presents with acute fever and chills."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-neutral-850 placeholder-neutral-400 disabled:cursor-not-allowed"
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
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col gap-4">
          <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-neutral-500" />
              Patient Diagnostic History
            </h3>
            <p className="text-[10px] text-neutral-500">
              Symptom checker ML reports
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {latestPrediction ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                    Reported Symptoms:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {latestPrediction.symptoms.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold text-neutral-650 dark:text-neutral-350"
                      >
                        {formatSymptom(s)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                    Machine Learning Prognosis:
                  </span>
                  <div className="space-y-2">
                    {latestPrediction.results.slice(0, 3).map((res, index) => {
                      const percent = Math.round(res.confidence * 100);
                      return (
                        <div key={res.disease} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold">
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {res.disease}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${index === 0 ? "bg-indigo-650" : "bg-neutral-450"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {latestPrediction.recommendedTest && (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/30 rounded-xl">
                    <span className="block text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                      Suggested Diagnostic Test
                    </span>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-450 leading-relaxed font-semibold">
                      {latestPrediction.recommendedTest}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-450 italic">
                No symptom checker logs found for this patient.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
