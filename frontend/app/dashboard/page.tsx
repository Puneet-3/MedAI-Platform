import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowRight, Bot, FileText, MapPin, MessageCircle, NotebookPen } from "lucide-react";

const actions = [
  { title: "How are you feeling?", description: "Start a symptom check and save the results to discuss with a doctor.", action: "Check your symptoms", href: "/dashboard/symptom-checker", icon: Activity },
  { title: "Bring your questions", description: "Request a text consultation and talk through what is on your mind.", action: "See consultations", href: "/dashboard/consultations", icon: MessageCircle },
  { title: "Your reports, together", description: "Upload a medical report or read the notes from a doctor's review.", action: "Open your reports", href: "/dashboard/reports", icon: FileText },
  { title: "A quick question?", description: "Ask the assistant about a general health topic. Its answers are prepared, not a diagnosis.", action: "Ask the assistant", href: "/dashboard/chatbot", icon: Bot },
  { title: "Care around the corner", description: "Look for a hospital, clinic, or pharmacy near you and get directions.", action: "Find nearby care", href: "/dashboard/nearby", icon: MapPin },
  { title: "Look back, move forward", description: "Revisit earlier symptom checks before your next conversation.", action: "See symptom history", href: "/dashboard/history", icon: NotebookPen },
];
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const id = session.user.id;
  const activity = await Promise.allSettled([
    db.prediction.count({ where: { userId: id } }),
    db.report.count({ where: { userId: id } }),
    db.consultation.count({ where: { patientId: id, status: "COMPLETED" } }),
    db.consultation.findFirst({ where: { patientId: id, status: { in: ["WAITING", "ACTIVE"] } }, orderBy: { createdAt: "desc" } }),
  ]);
  const counts = activity.slice(0, 3).map(result => result.status === "fulfilled" ? String(result.value) : "—");
  const current = activity[3].status === "fulfilled" && typeof activity[3].value === "object" ? activity[3].value : null;
  const unavailable = activity.some(result => result.status === "rejected");
  const firstName = session.user.name?.trim().split(/\s+/)[0] || "there";
  return <div className="space-y-8">
    <section className="rounded-2xl border border-[#dce3d4] bg-[#edf1e6] p-7 dark:border-teal-900 dark:bg-teal-950 md:p-10"><p className="eyebrow">Your personal space</p><h1 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">Good to see you, {firstName}.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">A new question, a report to keep, or a conversation to continue. Start wherever you need to today.</p><Link href="/dashboard/symptom-checker" className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#294e42] px-5 py-3 text-sm text-white transition hover:bg-[#1d3c32]">Start a symptom check <ArrowRight className="size-4" /></Link></section>
    {unavailable && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">Your saved activity could not be loaded. Please refresh in a moment.</p>}
    {current && <Link href={`/dashboard/consultations/${current.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-white p-5 dark:border-teal-900 dark:bg-neutral-900"><span><span className="block text-sm font-semibold">{current.status === "ACTIVE" ? "Your doctor is ready" : "You are in the waiting room"}</span><span className="mt-1 block text-xs text-neutral-500">{current.status === "ACTIVE" ? "Continue your consultation." : "We will update your room when a doctor accepts your request."}</span></span><span className="inline-flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">Open consultation <ArrowRight className="size-4" /></span></Link>}
    <section aria-label="Your activity" className="grid grid-cols-3 gap-3 md:gap-5">{["Saved symptom checks", "Medical reports", "Completed consultations"].map((label, i) => <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:p-5"><p className="font-serif text-3xl">{counts[i]}</p><p className="mt-2 text-xs leading-relaxed text-neutral-500">{label}</p></div>)}</section>
    <section><h2 className="mb-5 font-serif text-2xl">What would help today?</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{actions.map(({ title, description, action, href, icon: Icon }) => <article key={href} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-[#a6b698] dark:border-neutral-800 dark:bg-neutral-900"><Icon className="mb-5 size-5 stroke-[1.6] text-[#71866a]" /><h3 className="font-serif text-xl">{title}</h3><p className="mb-6 mt-3 flex-1 text-sm leading-relaxed text-neutral-500">{description}</p><Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 dark:text-teal-300">{action}<ArrowRight className="size-4" /></Link></article>)}</div></section>
    <aside className="border-t border-neutral-200 pt-5 text-sm leading-relaxed text-neutral-500 dark:border-neutral-800"><span className="font-medium text-neutral-700 dark:text-neutral-300">Before your next consultation:</span> write down when symptoms started, any medicines you take, and the questions you want to ask.</aside>
  </div>;
}
