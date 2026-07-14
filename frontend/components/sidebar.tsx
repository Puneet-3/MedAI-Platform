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
  HeartPulse
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/symptom-checker", label: "Symptom Checker", icon: Activity },
  { href: "/dashboard/history", label: "Prediction History", icon: History },
  { href: "/dashboard/reports", label: "Medical Reports", icon: FileText },
  { href: "/dashboard/consultations", label: "Consultations", icon: Video },
  { href: "/dashboard/chatbot", label: "AI Health Assistant", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

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
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur-md flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-neutral-200/60 dark:border-neutral-800">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300">
              MedAI
            </h1>
            <p className="text-[10px] text-neutral-500 font-medium tracking-wider uppercase">
              Smart Health
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-150/40 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                  isActive ? "text-white" : "text-neutral-500 dark:text-neutral-400"
                }`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info or system diagnostics */}
        <div className="p-4 border-t border-neutral-200/60 dark:border-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500 text-center font-medium">
          MedAI Platform v0.1.0
        </div>
      </aside>
    </>
  );
}
