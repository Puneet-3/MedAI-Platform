"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  History,
  FileText,
  Video,
  Bot,
  Menu,
  X,
  HeartPulse,
  MapPin
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  user?: {
    role?: string;
    name?: string | null;
    [key: string]: any;
  };
}

const patientNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/symptom-checker", label: "Symptom Checker", icon: Activity },
  { href: "/dashboard/history", label: "Prediction History", icon: History },
  { href: "/dashboard/reports", label: "Medical Reports", icon: FileText },
  { href: "/dashboard/consultations", label: "Consultations", icon: Video },
  { href: "/dashboard/chatbot", label: "AI Health Assistant", icon: Bot },
  { href: "/dashboard/nearby", label: "Facility Finder", icon: MapPin },
];

const doctorNavItems = [
  { href: "/doctor/dashboard", label: "Doctor Dashboard", icon: LayoutDashboard },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = user?.role === "ADMIN"
    ? adminNavItems
    : user?.role === "DOCTOR"
      ? doctorNavItems
      : patientNavItems;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-3 left-4 z-50 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm"
        aria-label="Toggle Navigation Menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur-md flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-200/60 dark:border-neutral-800">
          <Link href="/" className="group flex flex-col justify-center">
            <span className="font-serif text-2xl font-normal text-neutral-900 dark:text-neutral-100 tracking-tight group-hover:opacity-75 transition-opacity leading-none">
              MedAI
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wider uppercase mt-1">
              Clinical Intelligence
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-[#E86591] to-[#38BDF8] text-white shadow-md shadow-pink-500/15"
                    : "text-slate-600 dark:text-neutral-400 hover:bg-pink-50/70 hover:text-[#9D174D] dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-[#E86591] dark:text-neutral-400"
                }`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info or system diagnostics */}
        <div className="p-4 border-t border-slate-100 dark:border-neutral-800 text-[10px] text-slate-400 dark:text-neutral-500 text-center font-medium">
          MedAI Clinical Platform
        </div>
      </aside>
    </>
  );
}
