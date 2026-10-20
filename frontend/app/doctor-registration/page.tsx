import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText, LockKeyhole, MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CheckDoctorApproval } from "@/components/check-doctor-approval";

export const metadata = { title: "Doctor registration" };

export default async function DoctorRegistrationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "DOCTOR") redirect("/doctor/dashboard");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (!session.user.doctorAccessRequested) redirect("/dashboard");

  return <WorkspaceShell user={session.user}>
    <div className="max-w-3xl space-y-6">
      <div><p className="eyebrow">Your practice</p><h1 className="mt-2 font-serif text-3xl">Doctor registration</h1><p className="mt-2 text-sm text-neutral-500">Welcome{session.user.name ? `, ${session.user.name}` : ""}.</p></div>
      <section className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p role="status" className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"><Clock className="size-4" />Approval pending</p>
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">Your Doctor selection is saved. An administrator needs to verify your account before you can access patient reports and consultations.</p>
        <div className="flex flex-wrap items-center gap-4"><CheckDoctorApproval /><Link href="/account" className="text-sm underline underline-offset-4">Your account</Link></div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">{[{ title: "Patient reports", detail: "Review uploaded reports and add your notes.", icon: FileText }, { title: "Consultations", detail: "View the waiting room and talk with patients.", icon: MessageCircle }].map(({ title, detail, icon: Icon }) => <section key={title} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"><Icon className="size-5 text-[#71866a]" /><h2 className="mt-3 font-medium">{title}</h2><p className="mt-2 text-sm leading-relaxed text-neutral-500">{detail}</p><p className="mt-4 flex items-center gap-2 text-xs text-neutral-500"><LockKeyhole className="size-3.5" />Available after approval</p></section>)}</div>
    </div>
  </WorkspaceShell>;
}
