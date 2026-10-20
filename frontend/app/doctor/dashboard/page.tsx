"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Video,
  History,
  Clock,
  CheckCircle2,
  ArrowRight,
  Activity,
  Loader2,
  AlertCircle,
  FileText,
  UserPlus,
  Eye,
  CheckSquare
} from "lucide-react";

interface PredictionData {
  symptoms: string[];
  results: { disease: string; confidence: number }[];
  recommendedTest: string | null;
}

interface Report {
  id: string;
  userId: string;
  fileUrl: string;
  reportType: string;
  cnnLabel: string | null;
  cnnConfidence: number | null;
  status: "PENDING" | "ANALYZED" | "REVIEWED";
  doctorNotes: string | null;
  patient: {
    name: string;
    email: string;
  };
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
  latestPrediction?: PredictionData | null;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"queue" | "active" | "history" | "reports">("queue");
  const [queue, setQueue] = useState<Consultation[]>([]);
  const [activeRooms, setActiveRooms] = useState<Consultation[]>([]);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [analyzedReports, setAnalyzedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive IDs
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [reviewReportId, setReviewReportId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/doctor/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard data.");

      setQueue(data.queue || []);
      setActiveRooms(data.active || []);
      setHistory(data.history || []);
      setAnalyzedReports(data.analyzedReports || []);
    } catch (err: unknown) {
      console.error(err);
      setError((err instanceof Error ? err.message : "") || "Failed to load clinic data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/doctor/dashboard`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn't load this page.");
        if (!controller.signal.aborted) { setQueue(data.queue || []); setActiveRooms(data.active || []); setHistory(data.history || []); setAnalyzedReports(data.analyzedReports || []); }
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "We couldn't load this page."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    // Poll for queue & reports changes every 6 seconds
    const interval = setInterval(fetchDashboardData, 6000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);

  const handleAccept = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept patient.");

      router.push(`/doctor/consultations/${id}`);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "An error occurred.");
      setActionLoadingId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent, reportId: string) => {
    e.preventDefault();
    if (!reviewNotes.trim()) return;

    setReviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/doctor/reports/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorNotes: reviewNotes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review.");

      setReviewReportId(null);
      setReviewNotes("");
      fetchDashboardData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to submit review notes.");
    } finally {
      setReviewLoading(false);
    }
  };

  const getWaitTime = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMins = Math.round((now - created) / 60000);
    return diffMins <= 0 ? "Just now" : `${diffMins}m ago`;
  };

  const formatSymptom = (sym: string) => {
    return sym.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500">Initializing Doctor workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Doctor workspace</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Review waiting room queues, accept diagnostic consultation requests, review AI-flagged reports, and issue prescriptions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-950 text-red-700 dark:text-red-400 text-xs flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-6 text-sm font-semibold text-neutral-400">
        <button
          onClick={() => setActiveTab("queue")}
          className={`pb-3 relative transition-colors ${
            activeTab === "queue"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Patient Queue
            {queue.length > 0 && (
              <span className="bg-teal-600 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                {queue.length}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 relative transition-colors ${
            activeTab === "active"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Video className="w-4 h-4" />
            Active Consultations
            {activeRooms.length > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0">
                {activeRooms.length}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 relative transition-colors ${
            activeTab === "reports"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Flagged Reports
            {analyzedReports.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                {analyzedReports.length}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 relative transition-colors ${
            activeTab === "history"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4" /> History
          </span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">

        {/* Patient Queue Tab */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {queue.length > 0 ? (
              queue.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {c.patient.name || "Anonymous Patient"}
                      </h3>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        ({c.patient.email})
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                        <Clock className="w-3 h-3" /> {getWaitTime(c.createdAt)}
                      </span>
                    </div>

                    {c.latestPrediction ? (
                      <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                          <Activity className="w-3.5 h-3.5" /> Latest Symptom Analyzer Logs
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {c.latestPrediction.symptoms.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                              >
                                {formatSymptom(s)}
                              </span>
                            ))}
                          </div>

                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            Prognosis: <span className="font-bold text-neutral-800 dark:text-neutral-200">
                              {c.latestPrediction.results[0]?.disease || "Unknown"}
                            </span>{" "}
                            ({Math.round((c.latestPrediction.results[0]?.confidence || 0) * 100)}% Model match)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">
                        No symptom checker reports found for this patient.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleAccept(c.id)}
                    disabled={actionLoadingId === c.id}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/10 shrink-0"
                  >
                    {actionLoadingId === c.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Accept Patient
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
                <div className="p-4 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    Queue is currently empty
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    New telehealth requests from active patients will pop up here in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Consultations Tab */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeRooms.length > 0 ? (
              activeRooms.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {c.patient.name || "Anonymous Patient"}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Active room ID: <span className="font-mono text-[11px] bg-neutral-50 dark:bg-neutral-800 px-1 py-0.5 rounded">{c.id.substring(0,8)}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/doctor/consultations/${c.id}`)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/10 shrink-0"
                  >
                    Resume Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
                <div className="p-4 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                  <Video className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    No active consultations
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Accept patients from the waiting room queue to start telehealth sessions.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}


        {activeTab === "reports" && (
          <div className="space-y-4">
            {analyzedReports.length > 0 ? (
              analyzedReports.map((r) => {
                const percent = Math.round((r.cnnConfidence || 0) * 100);
                const isPneumonia = r.cnnLabel === "Pneumonia";
                const isReviewing = reviewReportId === r.id;

                return (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4"
                  >
                    {/* Top Panel info */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                            Patient: {r.patient.name}
                          </h3>
                          <span className="text-xs text-neutral-400">({r.patient.email})</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Classification: <span className="font-semibold">{r.reportType}</span>
                        </p>
                      </div>

                      {/* CNN Label badge */}
                      {r.cnnLabel && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                          isPneumonia
                            ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200"
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                        }`}>
                          <Activity className="w-3.5 h-3.5" />
                          {r.cnnLabel} ({percent}%)
                        </span>
                      )}
                    </div>

                    {!r.cnnLabel && <p className="text-sm text-neutral-500">No automated screening result. Review the original report directly.</p>}
                    {/* Action buttons */}
                    <div className="flex gap-2 items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open report
                      </a>

                      {!isReviewing ? (
                        <button
                          onClick={() => {
                            setReviewReportId(r.id);
                            setReviewNotes("");
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/10"
                        >
                          Review Report
                        </button>
                      ) : (
                        <button
                          onClick={() => setReviewReportId(null)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-neutral-500 uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Expanded Review Form */}
                    {isReviewing && (
                      <form
                        onSubmit={(e) => handleSubmitReview(e, r.id)}
                        className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl space-y-3 mt-4 animate-in slide-in-from-top-2 duration-300"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">
                            Review notes
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={3}
                            placeholder="Add your diagnostic summary, notes, or prescribed next actions here..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-neutral-800"
                            required
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={reviewLoading || !reviewNotes.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10"
                          >
                            {reviewLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Submitting Review...
                              </>
                            ) : (
                              <>
                                <CheckSquare className="w-3.5 h-3.5" />
                                Submit Clinical Review
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
                <div className="p-4 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    No reports pending review
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    New chest X-ray scans uploaded by patients will automatically be classified by our CNN model and show here.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {c.patient.name || "Anonymous Patient"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                      </span>
                      <span>•</span>
                      <span>ID: {c.id.substring(0,8)}</span>
                      <span>•</span>
                      <span>Date: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl max-w-md shrink-0">
                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Issued Prescription
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2 italic">
                      {c.prescription}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center space-y-4">
                <div className="p-4 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    No historical consultations
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Once you complete diagnostic sessions, they will be documented here.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
