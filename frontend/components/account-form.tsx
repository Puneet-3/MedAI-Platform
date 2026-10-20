"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountForm({ name, email, role, hasPassword, doctorAccessRequested = false }: { name: string; email: string; role: string; hasPassword: boolean; doctorAccessRequested?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: boolean; message: string } | null>(null);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true); setFeedback(null);
    try {
      if (values.get("newPassword") !== values.get("confirmPassword")) throw new Error("Your new passwords do not match.");
      const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(values)) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback({ message: data.message });
      for (const field of ["currentPassword", "newPassword", "confirmPassword"]) { const input = form.elements.namedItem(field); if (input instanceof HTMLInputElement) input.value = ""; }
      router.refresh();
    } catch (error) { setFeedback({ error: true, message: error instanceof Error ? error.message : "We couldn't save your changes." }); }
    finally { setPending(false); }
  }
  const style = "mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
  return <form onSubmit={save} className="max-w-xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
    <div><label htmlFor="account-name" className="text-sm font-medium">Your name</label><input id="account-name" name="name" defaultValue={name} required maxLength={100} autoComplete="name" className={style} /></div>
    <div><p className="text-sm font-medium">Email</p><p className="mt-2 text-sm text-neutral-500">{email}</p></div>
    <p className="text-xs text-neutral-500">{role === "USER" && doctorAccessRequested ? "Registration: Doctor · approval pending." : `Account access: ${role === "USER" ? "Patient" : role === "DOCTOR" ? "Doctor" : "Administrator"}.`} Clinical access is managed by a project administrator.</p>
    {hasPassword && <fieldset className="space-y-4 border-t border-neutral-200 pt-5 dark:border-neutral-800"><legend className="px-1 text-sm font-medium">Change your password (optional)</legend><label className="block text-sm" htmlFor="current-password">Current password<input id="current-password" name="currentPassword" type="password" autoComplete="current-password" className={style} /></label><label className="block text-sm" htmlFor="new-password">New password<input id="new-password" name="newPassword" type="password" minLength={8} maxLength={72} autoComplete="new-password" className={style} /><span className="mt-1 block text-xs text-neutral-500">At least 8 characters, up to 72 bytes.</span></label><label className="block text-sm" htmlFor="confirm-password">Confirm new password<input id="confirm-password" name="confirmPassword" type="password" minLength={8} maxLength={72} autoComplete="new-password" className={style} /></label></fieldset>}
    {feedback && <p role={feedback.error ? "alert" : "status"} className={`rounded-lg p-3 text-sm ${feedback.error ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"}`}>{feedback.message}</p>}
    <button disabled={pending} className="rounded-full bg-[#294e42] px-5 py-2.5 text-sm text-white disabled:opacity-50">{pending ? "Saving..." : "Save changes"}</button>
  </form>;
}
