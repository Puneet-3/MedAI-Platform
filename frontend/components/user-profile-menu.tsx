"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon, Shield } from "lucide-react";

interface UserProfileMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    doctorAccessRequested?: boolean;
    subscription?: string;
  };
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", escape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); document.removeEventListener("keydown", escape); };
  }, []);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || "US";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Your account menu" aria-expanded={isOpen} aria-controls="account-menu"
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-neutral-200 dark:border-neutral-700 focus:outline-none"
      >
        {user.image ? (
          <Image unoptimized width={32} height={32}
            src={user.image}
            alt={user.name || "Avatar"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#577248] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div id="account-menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1.5 shadow-lg shadow-neutral-100/50 dark:shadow-none animate-in fade-in-50 slide-in-from-top-3 duration-200 z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
              {user.name || "User"}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>

          {/* Badges / Roles info */}
          <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-neutral-100 dark:border-neutral-800">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              <Shield className="w-3 h-3" />
              {user.role === "USER" ? user.doctorAccessRequested ? "Doctor · approval pending" : "Patient" : user.role === "DOCTOR" ? "Doctor" : "Administrator"}
            </span>

          </div>

          {/* Actions */}
          <div className="pt-1">
            <Link href="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"><UserIcon className="size-4" /> Your account</Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors text-left font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
