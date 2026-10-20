"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role, ...(role === "ADMIN" ? { invitationCode: invitationCode.trim() } : {}) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#f5f3ed] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <Image
              width={32} height={32}
              src="/logo.png"
              alt="MedAI Logo"
              className="size-8 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-serif text-2xl font-normal text-neutral-900 tracking-tight">
              MedAI
            </span>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              Create an account
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              A place for your reports, questions, and next steps.
            </p>
          </div>
        </div>

        {/* Clean Centered Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="register-role" className="block text-xs font-medium text-neutral-700">Register as</label>
              <select id="register-role" name="role" value={role} disabled={loading} onChange={(event) => setRole(event.target.value)} aria-describedby="register-role-help" className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#66835b]">
                <option value="USER">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Administrator</option>
              </select>
              <p id="register-role-help" className="text-xs leading-relaxed text-neutral-500">{role === "ADMIN" ? "An invitation from an existing administrator is required." : role === "DOCTOR" ? "An administrator must verify and approve your doctor registration." : "Keep your reports, check symptoms, and talk to a doctor."}</p>
            </div>
            {role === "ADMIN" && <div className="space-y-1.5"><label htmlFor="admin-invitation" className="block text-xs font-medium text-neutral-700">Invitation code</label><input id="admin-invitation" name="invitationCode" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={1024} value={invitationCode} onChange={event => setInvitationCode(event.target.value)} placeholder="Paste your administrator invitation" className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#66835b]" /></div>}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="block text-xs font-medium text-neutral-700">
                Full Name
              </label>
              <input
                id="register-name" autoComplete="name" type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#66835b] focus:border-neutral-900 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-xs font-medium text-neutral-700">
                Email
              </label>
              <input
                id="register-email" autoComplete="email" type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#66835b] focus:border-neutral-900 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-xs font-medium text-neutral-700">
                Password
              </label>
              <input
                id="register-password" autoComplete="new-password" type="password" minLength={8} maxLength={72}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#66835b] focus:border-neutral-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#294e42] hover:bg-[#1d3c32] disabled:bg-neutral-400 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              {loading ? "Creating..." : role === "DOCTOR" ? "Create account & request doctor access" : "Create account"}
            </button>
          </form>

          <div className="pt-3 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-neutral-900 hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
