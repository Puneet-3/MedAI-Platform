"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center p-6 font-sans">
      <div className="bg-white border border-neutral-100 rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 shadow-sm">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-neutral-900">
            Access Denied
          </h2>
          <p className="text-sm text-neutral-500">
            You do not have the required permissions to access this page. If you believe this is an error, please verify your account role.
          </p>
        </div>
        <div className="pt-4 border-t border-neutral-100">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white uppercase tracking-wider transition-colors shadow-md shadow-emerald-600/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
