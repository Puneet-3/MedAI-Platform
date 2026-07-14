import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { 
  History, 
  Activity, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  FlaskConical
} from "lucide-react";
import Link from "next/link";

interface DiseaseResult {
  disease: string;
  confidence: number;
}

export default async function HistoryPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // Fetch all prediction history for this user
  const predictions = await db.prediction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const formatSymptom = (sym: string) => {
    return sym
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Prediction History</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review your past symptom analysis reports and diagnostic scans.
        </p>
      </div>

      {predictions.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-850 text-neutral-400">
            <History className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-neutral-700 dark:text-neutral-300 mt-4">
            No Records Found
          </h4>
          <p className="text-xs text-neutral-450 dark:text-neutral-550 max-w-sm mt-1 leading-relaxed">
            You haven't run any symptom predictions yet. Run your first check in the Symptom Checker to start logging.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/symptom-checker"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              Analyze Symptoms Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="relative border-l-2 border-neutral-100 dark:border-neutral-850 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8">
          {predictions.map((p) => {
            const results = (p.results as unknown) as DiseaseResult[];
            return (
              <div key={p.id} className="relative group">
                {/* Timeline Icon Node */}
                <div className="absolute -left-[35px] md:-left-[43px] top-1.5 p-1.5 rounded-full bg-neutral-50 dark:bg-neutral-950 border-2 border-indigo-600 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white z-10">
                  <Activity className="w-3.5 h-3.5" />
                </div>

                {/* Report Card */}
                <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-850 rounded-2xl hover:border-neutral-300 dark:hover:border-neutral-800 transition-all duration-300 hover:shadow-md">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 dark:border-neutral-850 pb-4 mb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(p.createdAt)}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono select-none">
                      ID: {p.id.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Symptoms Checked */}
                    <div className="md:col-span-6 space-y-3">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        Symptoms Evaluated
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.symptoms.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border border-neutral-150/40 dark:border-neutral-850"
                          >
                            {formatSymptom(s)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Predicted Class Results */}
                    <div className="md:col-span-6 space-y-4">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        AI Prognosis Output
                      </h4>
                      <div className="space-y-3">
                        {results.slice(0, 3).map((res, index) => {
                          const percent = Math.round(res.confidence * 100);
                          const isTop = index === 0;

                          return (
                            <div key={res.disease} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={`font-semibold ${isTop ? "text-indigo-650 dark:text-indigo-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                                  {res.disease}
                                </span>
                                <span className="font-semibold">{percent}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-850 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isTop ? "bg-indigo-600" : "bg-neutral-400 dark:bg-neutral-600"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Recommended Test Banner inside History */}
                      {p.recommendedTest && (
                        <div className="mt-3 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/25 flex gap-2.5 text-amber-800 dark:text-amber-300">
                          <FlaskConical className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                          <div>
                            <p className="text-[11px] font-bold">Suggested Labs</p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-450 mt-0.5">
                              Clinician recommended: **{p.recommendedTest}**
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Consult CTA Footer */}
                  <div className="border-t border-neutral-100 dark:border-neutral-850 mt-4 pt-4 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-450 dark:text-neutral-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                      Prognosis verified by Random Forest core
                    </span>
                    <Link
                      href="/dashboard/consultations"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                    >
                      Consult Doctor <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
