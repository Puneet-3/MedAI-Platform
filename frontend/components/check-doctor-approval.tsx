"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function CheckDoctorApproval() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())} className="inline-flex items-center gap-2 rounded-lg bg-[#294e42] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d3c32] disabled:opacity-50"><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />{pending ? "Checking..." : "Check approval"}</button>;
}
