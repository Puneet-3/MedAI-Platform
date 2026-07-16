"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Loader2,
  Calendar,
  Sparkles,
  Stethoscope
} from "lucide-react";
import { jsPDF } from "jspdf";

interface Consultation {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: "WAITING" | "ACTIVE" | "COMPLETED";
  prescription: string | null;
  createdAt: string;
  doctor?: {
    name: string;
    email: string;
  } | null;
}

export default function ConsultationsPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<Consultation | null>(null);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultations = async () => {
    try {
      const res = await fetch("/api/consultations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load consultations.");

      setCurrent(data.current);
      setHistory(data.history || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // Poll for status updates if the consultation is in WAITING or ACTIVE
  useEffect(() => {
    if (!current || current.status !== "WAITING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/consultations");
        const data = await res.json();
        if (res.ok) {
          setCurrent(data.current);
          if (data.current && data.current.status === "ACTIVE") {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [current]);

  const requestConsultation = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request consultation.");

      fetchConsultations();
    } catch (err: any) {
      setError(err.message || "Failed to request consultation.");
    } finally {
      setActionLoading(false);
    }
  };

  const generatePDF = (c: Consultation) => {
    if (!c.prescription) return;
    const doc = new jsPDF();

    // Color Palette
    const primaryColor = [16, 185, 129]; // Emerald 600
    const darkTextColor = [30, 41, 59]; // Slate 800
    const lightTextColor = [100, 116, 139]; // Slate 500

    // Title & Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("MedAI Healthcare", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text("Smart AI Diagnostics & Digital Consultations", 20, 31);
    
    // Horizontal rule
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, 190, 36);

    // Document Metadata
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("DIGITAL PRESCRIPTION", 20, 47);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text(`Prescription ID: ${c.id.toUpperCase().substring(0, 8)}`, 130, 47);
    doc.text(`Date Issued: ${new Date(c.createdAt).toLocaleDateString()}`, 130, 52);

    // Patient & Doctor Details
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
    doc.text(`Dr. ${c.doctor?.name || "Clinical Professional"}`, 25, 71);
    doc.text(`Email: ${c.doctor?.email || "consultations@medai.com"}`, 25, 76);
    doc.text(`ID: ${c.patientId.substring(0, 8)}`, 110, 71);

    // Content Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text("Rx — Treatment Plan & Notes:", 20, 97);

    // Prescription Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    
    // Handle word wrap
    const prescriptionText = c.prescription;
    const splitText = doc.splitTextToSize(prescriptionText, 170);
    doc.text(splitText, 20, 105);

    // Signature Block (Static placeholder)
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

    doc.save(`MedAI-Prescription-${c.id.substring(0,8)}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500">Retrieving consultations data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Telehealth Consultations</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Connect with registered doctors instantly and get certified digital prescriptions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-950/40 text-red-700 dark:text-red-400 text-xs flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Action Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Queue / Action Room */}
        <div className="lg:col-span-7">
          {!current ? (
            /* Call to Action: No consultations */
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="p-4 w-fit rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  Request an On-Demand Consultation
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Submit a query to enter our patient consultation waiting room. A qualified clinical professional will accept your session shortly. Your symptom analyzer logs and AI prognosis report will automatically be made available to the attending physician to accelerate diagnosis.
                </p>
              </div>
              <button
                onClick={requestConsultation}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Requesting Room...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Consult a Doctor
                  </>
                )}
              </button>
            </div>
          ) : current.status === "WAITING" ? (
            /* Waiting Queue Room UI */
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-sm min-h-[350px] flex flex-col justify-center items-center">
              <div className="relative">
                {/* Pulsating radar circles */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping scale-200" />
                <div className="relative p-5 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                  <Stethoscope className="w-8 h-8" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-neutral-850 dark:text-neutral-100 flex items-center justify-center gap-2">
                  Waiting Room Queue
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed">
                  Your request has been successfully broadcast to all active clinical professionals. Please keep this browser window open. We will automatically redirect you as soon as a doctor accepts your consultation.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Searching Attending Doctor...</span>
              </div>
            </div>
          ) : (
            /* Active Consultation Card */
            <div className="bg-gradient-to-tr from-emerald-50/20 to-emerald-100/5 dark:from-emerald-950/20 dark:to-emerald-950/5 border border-emerald-500/35 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-4 w-fit rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/10">
                  <Video className="w-8 h-8 animate-pulse" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  Active Consultation
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  Consultation accepted by Physician
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Your session is ready! You are currently matched with:
                </p>
                <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-55/10 text-emerald-600 flex items-center justify-center font-bold">
                    Dr
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-250">
                      Dr. {current.doctor?.name || "Clinical Professional"}
                    </h4>
                    <p className="text-[10px] text-neutral-500">
                      {current.doctor?.email || "Attending Doctor"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/dashboard/consultations/${current.id}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10"
              >
                Enter Consultation Room
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Consultation History Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              Consultation History
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {history.length > 0 ? (
                history.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-950/10 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-250 truncate max-w-[150px]">
                        Dr. {c.doctor?.name || "Clinical Staff"}
                      </span>
                      <span className="text-[9px] text-neutral-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-neutral-100/50 dark:border-neutral-800/40">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-650 uppercase">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Complete
                      </span>
                      {c.prescription && (
                        <button
                          onClick={() => generatePDF(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-[10px] font-bold rounded-xl transition-all"
                        >
                          <Download className="w-3 h-3" /> PDF Rx
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-neutral-550 space-y-2">
                  <div className="p-2.5 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold">No Past Consultations</h4>
                  <p className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                    Once you complete a live consultation session, your reports and prescriptions will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
