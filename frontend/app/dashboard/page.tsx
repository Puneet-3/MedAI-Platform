import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Activity, 
  Video, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-6 md:p-8 text-white shadow-xl shadow-indigo-600/10">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Patient Portal
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {user.name || "Patient"}!
          </h2>
          <p className="text-indigo-100 text-sm md:text-base font-light">
            Check your symptoms, review reports, and connect with clinical professionals instantly.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/symptom-checker"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-neutral-50 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
            >
              Start Symptom Check
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative ambient blobs */}
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-x-12 translate-y-12" />
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-500/25 rounded-full blur-2xl" />
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Symptom Checker CTA */}
        <div className="group p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-500/40 dark:hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-100/30 dark:hover:shadow-none flex flex-col justify-between h-48">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4">
              AI Symptom Analyzer
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Input symptoms to get rapid diagnostic insights powered by our machine learning core.
            </p>
          </div>
          <Link
            href="/dashboard/symptom-checker"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all mt-4"
          >
            Start analysis <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Video Consultations CTA */}
        <div className="group p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-100/30 dark:hover:shadow-none flex flex-col justify-between h-48">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4">
              Telehealth Consultations
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Connect to your designated physician via secure, low-latency live video rooms.
            </p>
          </div>
          <Link
            href="/dashboard/consultations"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all mt-4"
          >
            Join room <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Medical Reports CTA */}
        <div className="group p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-sky-500/40 dark:hover:border-sky-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-100/30 dark:hover:shadow-none flex flex-col justify-between h-48">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4">
              Health Record Archive
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Upload clinical files, check machine classifications, and view notes.
            </p>
          </div>
          <Link
            href="/dashboard/reports"
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover:gap-2 transition-all mt-4"
          >
            View records <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* Subscription Tier Notice (Visual wow factor) */}
      {user.subscription !== "PREMIUM" && (
        <section className="p-6 rounded-2xl border border-amber-200/60 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 w-fit h-fit rounded-lg bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Unlock Premium Care Features
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Get unlimited ML scans, prior-priority physician lines, and permanent medical report backups.
              </p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors text-white text-xs font-bold shadow-sm shadow-amber-500/10 shrink-0">
            Upgrade to Premium
          </button>
        </section>
      )}
    </div>
  );
}
