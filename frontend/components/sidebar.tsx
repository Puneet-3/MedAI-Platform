"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bot, FileText, HeartHandshake, History, LayoutDashboard, MapPin, Menu, MessageCircle, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";

const patientItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/symptom-checker", label: "Symptom checker", icon: Activity },
  { href: "/dashboard/history", label: "Symptom history", icon: History },
  { href: "/dashboard/reports", label: "Your reports", icon: FileText },
  { href: "/dashboard/consultations", label: "Consultations", icon: MessageCircle },
  { href: "/dashboard/chatbot", label: "Health assistant", icon: Bot },
  { href: "/dashboard/nearby", label: "Nearby care", icon: MapPin },
];
export function Sidebar({ user }: { user?: { role?: string; name?: string | null; doctorAccessRequested?: boolean } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const doctorPending = user?.role === "USER" && user.doctorAccessRequested;
  const items = user?.role === "ADMIN" ? [{ href: "/admin", label: "Administration", icon: LayoutDashboard }] : user?.role === "DOCTOR" ? [{ href: "/doctor/dashboard", label: "Doctor workspace", icon: LayoutDashboard }] : doctorPending ? [{ href: "/doctor-registration", label: "Doctor registration", icon: LayoutDashboard }] : patientItems;
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", close); };
  }, [open]);
  return <>
    <button onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="workspace-navigation" className="fixed left-4 top-3 z-50 rounded-lg border border-neutral-200 bg-[#fffefa] p-2 dark:border-neutral-700 dark:bg-neutral-900 md:hidden">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
    {open && <button tabIndex={-1} aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-neutral-900 md:hidden" />}
    <aside id="workspace-navigation" className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-200 bg-[#fffefa] transition-transform dark:border-neutral-800 dark:bg-neutral-900 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <Link href="/" className="flex h-20 items-center gap-3 border-b border-neutral-100 px-6 pl-16 dark:border-neutral-800 md:pl-6"><Image src="/logo.png" alt="" width={30} height={30} className="size-[30px] shrink-0 object-contain" /><span className="font-serif text-3xl tracking-tight">MedAI<span className="text-[#71866a]">.</span></span></Link>
      <p className="px-6 pb-2 pt-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{user?.role === "DOCTOR" || doctorPending ? "Your practice" : user?.role === "ADMIN" ? "Manage project" : "Your care"}</p>
      <nav aria-label="Workspace navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">{[...items, { href: "/account", label: "Your account", icon: Settings }].map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
        return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${active ? "bg-[#eaf0e4] font-medium text-[#31583f] dark:bg-teal-950 dark:text-teal-200" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"}`}><Icon className="size-[18px] stroke-[1.7]" />{label}</Link>;
      })}</nav>
      <div className="m-4 rounded-xl bg-[#f3f4ec] p-4 dark:bg-neutral-800"><HeartHandshake className="mb-2 size-5 text-[#71866a]" /><p className="font-serif text-lg">One step at a time.</p><p className="mt-1 text-xs leading-relaxed text-neutral-500">Keep your questions close. Bring them to your next conversation.</p></div>
    </aside>
  </>;
}
