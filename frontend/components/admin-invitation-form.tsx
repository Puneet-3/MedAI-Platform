"use client";

import { useState } from "react";

export function AdminInvitationForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{ email: string; invitationCode: string; expiresAt: string } | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setError(null); setInvitation(null);
    try {
      const response = await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn't create the invitation.");
      setInvitation(data);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  }

  return <section className="space-y-4 border-b border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950">
    <div><h3 className="text-sm font-semibold">Invite an administrator</h3><p className="mt-1 text-xs leading-relaxed text-neutral-500">Create an invitation for a new administrator account.</p></div>
    <form onSubmit={create} className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><label htmlFor="invite-email" className="block text-xs font-medium">Email</label><input id="invite-email" type="email" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setInvitation(null); }} placeholder="name@example.com" className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900" /></div><button disabled={pending} className="rounded-lg bg-[#294e42] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d3c32] disabled:opacity-50">{pending ? "Creating..." : "Create invitation"}</button></form>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    {invitation && <div className="space-y-2"><label htmlFor="created-invitation" className="block text-xs font-medium">Invitation for {invitation.email}</label><textarea id="created-invitation" readOnly value={invitation.invitationCode} rows={3} className="w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900" /><p className="text-xs leading-relaxed text-neutral-500">Share this code privately. Choose Administrator on registration and use this email. Expires {new Date(invitation.expiresAt).toLocaleString()}.</p></div>}
  </section>;
}
