"use client";
import { Moon, Sun } from "lucide-react";
export function ThemeToggle() {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* A theme still works when storage is blocked. */ }
  };
  return <button onClick={toggle} aria-label="Switch light or dark theme" className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"><Moon className="size-[18px] dark:hidden" /><Sun className="hidden size-[18px] dark:block" /></button>;
}
