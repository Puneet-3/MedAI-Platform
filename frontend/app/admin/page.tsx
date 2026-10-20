"use client";

import { useState, useEffect } from "react";
import { AdminInvitationForm } from "@/components/admin-invitation-form";
import {
  Users,
  Bot,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Bookmark,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "DOCTOR" | "ADMIN";
  doctorAccessRequested: boolean;
  subscription: "FREE" | "PREMIUM";
  createdAt: string;
}

interface Intent {
  tag: string;
  patterns: string[];
  responses: string[];
}

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<"users" | "chatbot">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Intent form states
  const [newTag, setNewTag] = useState("");
  const [newPatterns, setNewPatterns] = useState("");
  const [newResponses, setNewResponses] = useState("");

  // Async Action Loaders
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);

  const fetchAdminData = async () => {
    try {
      if (activeTab === "users") {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load users.");
        setUsers(data.users || []);
      } else {
        const res = await fetch("/api/admin/intents");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load intents.");
        setIntents(data.intents || []);
      }
    } catch (err: unknown) {
      console.error(err);
      setError((err instanceof Error ? err.message : "") || "Failed to retrieve configuration data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(activeTab === "users" ? "/api/admin/users" : "/api/admin/intents", { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We couldn't load this page.");
        if (!controller.signal.aborted) { if (activeTab === "users") setUsers(data.users || []); else setIntents(data.intents || []); }
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "We couldn't load this page."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [activeTab]);

  const handleRoleChange = async (userId: string, newRole: "USER" | "DOCTOR") => {
    setActionLoadingId(userId);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role.");

      setSuccess(newRole === "DOCTOR" ? "Doctor access approved." : "Patient access saved. Any pending doctor request has been closed.");
      fetchAdminData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !newPatterns.trim() || !newResponses.trim()) return;
    if (intents.some(intent => intent.tag === newTag.trim().toLowerCase())) { setError("That topic already exists. Choose a different tag."); return; }

    setError(null);
    setSuccess(null);

    const patternsArray = newPatterns.split("\n").map(p => p.trim()).filter(p => p.length > 0);
    const responsesArray = newResponses.split("\n").map(r => r.trim()).filter(r => r.length > 0);

    const updatedIntents = [
      ...intents,
      { tag: newTag.trim().toLowerCase(), patterns: patternsArray, responses: responsesArray }
    ];

    try {
      const res = await fetch("/api/admin/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intents: updatedIntents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save intents.");

      setSuccess("New intent added successfully. Please click 'Retrain Chatbot' to reload the model.");
      setNewTag("");
      setNewPatterns("");
      setNewResponses("");
      fetchAdminData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to add intent.");
    }
  };

  const handleDeleteIntent = async (tag: string) => {
    setError(null);
    setSuccess(null);
    const updatedIntents = intents.filter(intent => intent.tag !== tag);

    try {
      const res = await fetch("/api/admin/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intents: updatedIntents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete intent.");

      setSuccess("Intent deleted successfully. Click 'Retrain Chatbot' to deploy model.");
      fetchAdminData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to delete intent.");
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/retrain", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retraining failed.");

      setSuccess("The assistant is retrained and ready to use.");
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Failed to retrain ML model.");
    } finally {
      setRetraining(false);
    }
  };

  if (loading && users.length === 0 && intents.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500">Loading system configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Admin Console</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Review doctor access requests, manage accounts, and maintain the health assistant. Verify professional credentials before granting doctor access.
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 dark:text-emerald-400 text-xs flex gap-2 items-center">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 text-red-800 dark:text-red-400 text-xs flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-6 text-sm font-semibold text-neutral-400">
        <button
          onClick={() => { setLoading(true); setError(null); setActiveTab("users"); }}
          className={`pb-3 relative transition-colors ${
            activeTab === "users"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            User Directory
          </span>
        </button>

        <button
          onClick={() => { setLoading(true); setError(null); setActiveTab("chatbot"); }}
          className={`pb-3 relative transition-colors ${
            activeTab === "chatbot"
              ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Bot className="w-4 h-4" />
            Chatbot Knowledgebase
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">

        {/* User directory */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            <AdminInvitationForm />
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Registered Accounts Directory
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role Badge</th>
                    <th className="px-6 py-4">Register Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-950">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">
                          {u.name || "Anonymous Patient"}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${
                          u.role === "ADMIN"
                            ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200"
                            : u.role === "DOCTOR"
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                              : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-100"
                        }`}>
                          <Shield className="w-2.5 h-2.5" /> {u.role}
                        </span>
                        {u.doctorAccessRequested && <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">Doctor access requested · awaiting verification</p>}
                      </td>

                      <td className="px-6 py-4 text-neutral-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {/* Toggle Doctor Action */}
                        <button
                          onClick={() => handleRoleChange(u.id, u.role === "DOCTOR" ? "USER" : "DOCTOR")}
                          disabled={actionLoadingId === u.id || u.role === "ADMIN"}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                            u.role === "ADMIN"
                              ? "opacity-50 cursor-not-allowed border-neutral-100"
                              : u.role === "DOCTOR"
                                ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {actionLoadingId === u.id ? "Saving..." : u.role === "ADMIN" ? "Administrator" : u.role === "DOCTOR" ? "Change to patient" : u.doctorAccessRequested ? "Approve doctor access" : "Grant doctor access"}
                        </button>
                        {u.doctorAccessRequested && <button onClick={() => handleRoleChange(u.id, "USER")} disabled={actionLoadingId === u.id} className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">Decline request</button>}

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chatbot Intents Knowledgebase */}
        {activeTab === "chatbot" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Form & Trigger Retrain */}
            <div className="lg:col-span-5 space-y-6">
              {/* Retrain Action Card */}
              <div className="bg-teal-50 dark:bg-teal-950 border border-teal-500 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-teal-600 ${retraining ? "animate-spin" : ""}`} />
                  AI Retraining Pipeline
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Modified intents must be compiled into the MLP Neural Classifier. Retraining processes words, stems tokens, and rebuilds bag-of-words weights.
                </p>
                <button
                  onClick={handleRetrain}
                  disabled={retraining}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/10"
                >
                  {retraining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Training MLP Model...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      Retrain Chatbot Classifier
                    </>
                  )}
                </button>
              </div>

              {/* Add Intent Form */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 space-y-5 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-neutral-500" />
                  Add New Bot Intent
                </h3>

                <form onSubmit={handleAddIntent} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      Intent Tag (Unique Identifier)
                    </label>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="e.g. fever"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-neutral-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      Patterns (Training queries, one per line)
                    </label>
                    <textarea
                      value={newPatterns}
                      onChange={(e) => setNewPatterns(e.target.value)}
                      rows={3}
                      placeholder="I have a high fever&#10;My body temperature is high&#10;Feeling hot and shivering"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-neutral-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      Bot Responses (One per line)
                    </label>
                    <textarea
                      value={newResponses}
                      onChange={(e) => setNewResponses(e.target.value)}
                      rows={3}
                      placeholder="A fever is a sign your body is fighting infection. Stay hydrated.&#10;Monitor your temperature. If it exceeds 102 F, consult a doctor."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-neutral-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10"
                  >
                    <Plus className="w-4 h-4" /> Add Intent
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Intents List */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-1.5">
                  <Bookmark className="w-4.5 h-4.5 text-neutral-600" />
                  Active intents.json Vocabulary
                </h3>

                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {intents.map((intent) => (
                    <div
                      key={intent.tag}
                      className="p-4 border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-2xl space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 uppercase tracking-widest border border-teal-100 dark:border-teal-900">
                          tag: {intent.tag}
                        </span>

                        <button
                          onClick={() => handleDeleteIntent(intent.tag)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                          aria-label={`Delete intent ${intent.tag}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-neutral-500 block">Patterns:</span>
                          <ul className="list-disc list-inside text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5 mt-0.5">
                            {intent.patterns.map((p, idx) => (
                              <li key={idx} className="truncate">&quot;{p}&quot;</li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                          <span className="font-bold text-neutral-500 block">Responses:</span>
                          <ul className="list-disc list-inside text-[11px] text-neutral-600 dark:text-neutral-300 space-y-0.5 mt-0.5">
                            {intent.responses.map((r, idx) => (
                              <li key={idx} className="italic">&quot;{r}&quot;</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
