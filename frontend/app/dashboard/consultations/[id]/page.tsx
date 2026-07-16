"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { 
  Send, 
  ArrowLeft, 
  Stethoscope, 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle,
  MessageSquare,
  Activity,
  CheckCircle2
} from "lucide-react";
import { jsPDF } from "jspdf";

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
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
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
      
      // Determine current user ID (patient ID)
      if (data.consultation) {
        currentUserId.current = data.consultation.patientId;
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

    // Check if session status updates to completed via database changes
    const statusInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/consultations/${id}`);
        const data = await res.json();
        if (res.ok && data.consultation.status === "COMPLETED") {
          setConsultation(data.consultation);
          clearInterval(statusInterval);
        }
      } catch (err) {
        console.error("Check status error:", err);
      }
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(statusInterval);
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

  const generatePDF = () => {
    if (!consultation || !consultation.prescription) return;
    const doc = new jsPDF();
    const primaryColor = [16, 185, 129];
    const darkTextColor = [30, 41, 59];
    const lightTextColor = [100, 116, 139];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("MedAI Healthcare", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text("Smart AI Diagnostics & Digital Consultations", 20, 31);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, 190, 36);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("DIGITAL PRESCRIPTION", 20, 47);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text(`Prescription ID: ${consultation.id.toUpperCase().substring(0, 8)}`, 130, 47);
    doc.text(`Date Issued: ${new Date(consultation.createdAt).toLocaleDateString()}`, 130, 52);

    doc.setFillColor(250, 249, 245);
    doc.rect(20, 58, 170, 25, "F");
    doc.setDrawColor(241, 239, 233);
    doc.rect(20, 58, 170, 25, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("Attending Physician:", 25, 65);
    doc.text("Patient Information:", 110, 65);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text(`Dr. ${consultation.doctor?.name || "Clinical Professional"}`, 25, 71);
    doc.text(`Email: ${consultation.doctor?.email || "consultations@medai.com"}`, 25, 76);
    doc.text(`ID: ${consultation.patientId.substring(0, 8)}`, 110, 71);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("Rx — Treatment Plan & Notes:", 20, 97);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    
    const splitText = doc.splitTextToSize(consultation.prescription, 170);
    doc.text(splitText, 20, 105);

    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(226, 232, 240);
    doc.line(130, pageHeight - 45, 180, pageHeight - 45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Authorized Signature", 140, pageHeight - 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text("Generated securely via MedAI Smart Health Portal", 20, pageHeight - 15);

    doc.save(`MedAI-Prescription-${consultation.id.substring(0,8)}.pdf`);
  };

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

  if (error || !consultation) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h3 className="text-base font-bold text-neutral-850">Room Initialization Failed</h3>
        <p className="text-xs text-neutral-500 max-w-sm">{error || "Consultation not found."}</p>
        <button
          onClick={() => router.push("/dashboard/consultations")}
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
      
      {/* Left Area: Chat Room & Messages */}
      <div className="lg:col-span-8 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/consultations")}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
              aria-label="Back to queue"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-xs font-bold text-neutral-850 dark:text-neutral-200">
                Dr. {consultation.doctor?.name || "Clinical Professional"}
              </h3>
              <p className="text-[9px] text-neutral-450 dark:text-neutral-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-neutral-400" : "bg-emerald-500 animate-pulse"}`} />
                {isCompleted ? "Session Completed" : "Session Active"}
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-350">
            Telehealth Live
          </div>
        </header>

        {/* Message History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[45vh] min-h-[35vh]">
          {messages.length > 0 ? (
            messages.map((m) => {
              const isMe = m.senderId === consultation.patientId;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      Dr
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
                      <span className="block text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-0.5">
                        Dr. {m.sender.name}
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
                Consultation session started. Say hello to Dr. {consultation.doctor?.name || "clinical professional"}.
              </p>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Prescription Notice / PDF Download Box */}
        {isCompleted && (
          <div className="p-6 border-t border-neutral-200/60 dark:border-neutral-800 bg-emerald-50/15 dark:bg-emerald-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 w-fit h-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Digital Prescription Issued
                </h4>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-450 mt-0.5 leading-relaxed">
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
            className="p-4 border-t border-neutral-200/60 dark:border-neutral-800 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message to the doctor..."
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

      {/* Right Area: Symptom Checker logs */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 space-y-5 shadow-sm h-full flex flex-col">
          
          <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-neutral-500" />
              Attending Room Details
            </h3>
            <p className="text-[10px] text-neutral-500">
              Physician reference board
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {/* Doctor Info */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                Doctor Profile
              </span>
              <div className="p-3.5 bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-100 dark:border-neutral-850 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center font-bold text-xs">
                  Dr
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Dr. {consultation.doctor?.name || "Attending Physician"}
                  </h4>
                  <p className="text-[10px] text-neutral-550">
                    {consultation.doctor?.email || "consultations@medai.com"}
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostic reference logs */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest block">
                Symptom Reference Logs
              </span>
              
              {latestPrediction ? (
                <div className="space-y-4">
                  {/* Symptoms */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      Reported Symptoms:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {latestPrediction.symptoms.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[9px] font-bold text-neutral-600 dark:text-neutral-350"
                        >
                          {formatSymptom(s)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Prognosis */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      Machine Learning Prognosis:
                    </span>
                    <div className="space-y-2">
                      {latestPrediction.results.slice(0, 2).map((res, index) => {
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
                                className={`h-full rounded-full ${index === 0 ? "bg-indigo-650" : "bg-neutral-400"}`}
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
                <p className="text-xs text-neutral-450 italic">
                  No symptom checker scans recorded. Make a scan on the Symptom Checker page to populate details.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 text-[9px] text-neutral-400 leading-relaxed text-center">
            Encryption: SSL End-to-End Chat Tunnel active. HIPAA & SAIF compliant.
          </div>
        </div>
      </div>
    </div>
  );
}
