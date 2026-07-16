"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Bot, 
  Settings, 
  Trash2, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Shield,
  Zap,
  Bookmark,
  Sparkles
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "DOCTOR" | "ADMIN";
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to retrieve configuration data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAdminData();
  }, [activeTab]);

  const handleRoleToggle = async (userId: string, currentRole: User["role"]) => {
    setActionLoadingId(userId);
    setError(null);
    const newRole = currentRole === "DOCTOR" ? "USER" : "DOCTOR";
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role.");
      
      setSuccess(`Updated user role successfully to ${newRole}.`);
      fetchAdminData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTierToggle = async (userId: string, currentTier: User["subscription"]) => {
    setActionLoadingId(userId + "_tier");
    setError(null);
    const newTier = currentTier === "PREMIUM" ? "FREE" : "PREMIUM";

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: newTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tier.");

      setSuccess(`Updated user billing tier successfully to ${newTier}.`);
      fetchAdminData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !newPatterns.trim() || !newResponses.trim()) return;

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
    } catch (err: any) {
      setError(err.message || "Failed to add intent.");
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
    } catch (err: any) {
      setError(err.message || "Failed to delete intent.");
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

      setSuccess("AI Chatbot retrained and reloaded successfully in-memory!");
    } catch (err: any) {
      setError(err.message || "Failed to retrain ML model.");
    } finally {
      setRetraining(false);
    }
  };

  if (loading && users.length === 0 && intents.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500">Loading system configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Admin Console</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage system users, promote doctor accounts, edit chatbot intents, and retrain ML classifiers.
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/30 text-emerald-800 dark:text-emerald-450 text-xs flex gap-2 items-center">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-250/30 text-red-800 dark:text-red-400 text-xs flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 flex gap-6 text-sm font-semibold text-neutral-400">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 relative transition-colors ${
            activeTab === "users" 
              ? "text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-650 dark:border-indigo-400" 
              : "hover:text-neutral-700 dark:hover:text-neutral-200"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> 
            User Directory
          </span>
        </button>

        <button
          onClick={() => setActiveTab("chatbot")}
          className={`pb-3 relative transition-colors ${
            activeTab === "chatbot" 
              ? "text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-650 dark:border-indigo-400" 
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
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-850">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Registered Accounts Directory
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950/20 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200/60 dark:border-neutral-800">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role Badge</th>
                    <th className="px-6 py-4">Care Tier</th>
                    <th className="px-6 py-4">Register Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/10">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-800 dark:text-neutral-250">
                          {u.name || "Anonymous Patient"}
                        </div>
                        <div className="text-[10px] text-neutral-450 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          u.role === "ADMIN" 
                            ? "bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 border-red-200/35"
                            : u.role === "DOCTOR"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250/30"
                              : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-150/40"
                        }`}>
                          <Shield className="w-2.5 h-2.5" /> {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          u.subscription === "PREMIUM"
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                            : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}>
                          <Zap className="w-2.5 h-2.5" /> {u.subscription}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-450">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {/* Toggle Doctor Action */}
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          disabled={actionLoadingId === u.id || u.role === "ADMIN"}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                            u.role === "ADMIN"
                              ? "opacity-50 cursor-not-allowed border-neutral-100"
                              : u.role === "DOCTOR"
                                ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200/40"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250/35"
                          }`}
                        >
                          {actionLoadingId === u.id ? "Syncing..." : u.role === "DOCTOR" ? "Demote to User" : "Make Doctor"}
                        </button>
                        
                        {/* Toggle Premium Action */}
                        <button
                          onClick={() => handleTierToggle(u.id, u.subscription)}
                          disabled={actionLoadingId === u.id + "_tier"}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-[10px] font-bold rounded-lg transition-all"
                        >
                          {actionLoadingId === u.id + "_tier" ? "Syncing..." : u.subscription === "PREMIUM" ? "Remove Premium" : "Give Premium"}
                        </button>
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
              <div className="bg-gradient-to-tr from-indigo-50/20 to-indigo-100/5 dark:from-indigo-950/20 dark:to-indigo-950/5 border border-indigo-500/35 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-indigo-650 ${retraining ? "animate-spin" : ""}`} />
                  AI Retraining Pipeline
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed">
                  Modified intents must be compiled into the MLP Neural Classifier. Retraining processes words, stems tokens, and rebuilds bag-of-words weights.
                </p>
                <button
                  onClick={handleRetrain}
                  disabled={retraining}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/10"
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
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 space-y-5 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-neutral-500" />
                  Add New Bot Intent
                </h3>

                <form onSubmit={handleAddIntent} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                      Intent Tag (Unique Identifier)
                    </label>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="e.g. fever"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-neutral-850"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                      Patterns (Training queries, one per line)
                    </label>
                    <textarea
                      value={newPatterns}
                      onChange={(e) => setNewPatterns(e.target.value)}
                      rows={3}
                      placeholder="I have a high fever&#10;My body temperature is high&#10;Feeling hot and shivering"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-neutral-850"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                      Bot Responses (One per line)
                    </label>
                    <textarea
                      value={newResponses}
                      onChange={(e) => setNewResponses(e.target.value)}
                      rows={3}
                      placeholder="A fever is a sign your body is fighting infection. Stay hydrated.&#10;Monitor your temperature. If it exceeds 102 F, consult a doctor."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-neutral-850"
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
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-1.5">
                  <Bookmark className="w-4.5 h-4.5 text-neutral-555" />
                  Active intents.json Vocabulary
                </h3>
                
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                  {intents.map((intent) => (
                    <div
                      key={intent.tag}
                      className="p-4 border border-neutral-100 dark:border-neutral-850 bg-neutral-50/20 dark:bg-neutral-950/10 rounded-2xl space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/40">
                          tag: {intent.tag}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteIntent(intent.tag)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-lg"
                          aria-label={`Delete intent ${intent.tag}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-neutral-550 block">Patterns:</span>
                          <ul className="list-disc list-inside text-[11px] text-neutral-600 dark:text-neutral-350 space-y-0.5 mt-0.5">
                            {intent.patterns.map((p, idx) => (
                              <li key={idx} className="truncate">"{p}"</li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-neutral-150/40 dark:border-neutral-800/40">
                          <span className="font-bold text-neutral-550 block">Responses:</span>
                          <ul className="list-disc list-inside text-[11px] text-neutral-600 dark:text-neutral-350 space-y-0.5 mt-0.5">
                            {intent.responses.map((r, idx) => (
                              <li key={idx} className="italic">"{r}"</li>
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
