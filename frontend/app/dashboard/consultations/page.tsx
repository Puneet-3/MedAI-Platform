"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
  Calendar,
  Stethoscope
} from "lucide-react";
import { downloadPrescription } from "@/lib/prescription";

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
    } catch (err: unknown) {
      console.error(err);
      setError((err instanceof Error ? err.message : "") || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/consultations`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn't load this page.");
        if (!controller.signal.aborted) { setCurrent(data.current); setHistory(data.history || []); }
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "We couldn't load this page."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
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
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to request consultation.");
    } finally {
      setActionLoading(false);
    }
  };

  const generatePDF = (c: Consultation) => downloadPrescription(c);
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
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Your consultations</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Request a text consultation. When a doctor is available, you can discuss your symptoms and download their notes.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-950 text-red-700 dark:text-red-400 text-xs flex gap-2 items-center">
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
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="p-4 w-fit rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
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
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-sm min-h-[350px] flex flex-col justify-center items-center">
              <div className="relative">
                {/* Pulsating radar circles */}
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-emerald-50 animate-ping scale-200" />
                <div className="relative p-5 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                  <Stethoscope className="w-8 h-8" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center justify-center gap-2">
                  Waiting Room Queue
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Your request has been successfully broadcast to all active clinical professionals. Please keep this browser window open. We will automatically redirect you as soon as a doctor accepts your consultation.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Searching Attending Doctor...</span>
              </div>
            </div>
          ) : (
            /* Active Consultation Card */
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-500 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-4 w-fit rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/10">
                  <Video className="w-8 h-8 animate-pulse" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
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
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    Dr
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Dr. {current.doctor?.name || "Clinical Professional"}
                    </h4>
                    <p className="text-xs text-neutral-500">
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
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              Consultation History
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {history.length > 0 ? (
                history.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">
                        Dr. {c.doctor?.name || "Clinical Staff"}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Complete
                      </span>
                      {c.prescription && (
                        <button
                          onClick={() => generatePDF(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl transition-all"
                        >
                          <Download className="w-3 h-3" /> PDF Rx
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-neutral-500 space-y-2">
                  <div className="p-2.5 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold">No Past Consultations</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
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
