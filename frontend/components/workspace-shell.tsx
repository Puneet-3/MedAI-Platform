import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import type { Session } from "next-auth";

export function WorkspaceShell({ user, children }: { user: Session["user"]; children: React.ReactNode }) {
  const title = user.role === "DOCTOR" ? "Doctor workspace" : user.role === "ADMIN" ? "Project administration" : user.doctorAccessRequested ? "Doctor registration" : "Your health, in one place";
  return <div className="min-h-screen bg-[#f7f8f4] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
    <a href="#workspace-content" className="skip-link">Skip to content</a><Sidebar user={user} />
    <div className="flex min-h-screen min-w-0 flex-col md:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-[#fffefa] px-5 pl-16 dark:border-neutral-800 dark:bg-neutral-950 md:px-8"><span className="text-sm text-neutral-500">{title}</span><div className="flex shrink-0 items-center gap-3"><ThemeToggle /><UserProfileMenu user={user} /></div></header>
      <main id="workspace-content" className="mx-auto w-full max-w-7xl flex-1 px-5 py-7 md:p-8">{children}</main>
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-3 px-5 pb-6 text-xs leading-relaxed text-neutral-500 md:px-8"><span>MedAI is an experimental project. Medical decisions need a doctor.</span><Link href="/account" className="underline underline-offset-4">Your account</Link></footer>
    </div>
  </div>;
}
