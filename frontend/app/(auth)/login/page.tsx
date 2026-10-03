"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { HeartPulse, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRegistered(false);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        throw new Error("Invalid email or password.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F8] via-[#F8FBFE] to-[#F1F6FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-all duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        {/* Logo */}
        <Link href="/" className="inline-block group py-2">
          <span className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight group-hover:opacity-75 transition-opacity">
            MedAI
          </span>
        </Link>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#173364]">
            Sign in to MedAI
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Access your patient dashboard, diagnostic results, and chatbot
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 border border-pink-100 rounded-3xl sm:px-10">
          
          {registered && (
            <div className="mb-4 p-3.5 rounded-xl bg-pink-50 border border-pink-200/60 flex gap-2 text-[#9D174D] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#E86591]" />
              <span>Registration successful! Please sign in below.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200/60 flex gap-2 text-red-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-[#E86591] text-xs text-slate-900 font-medium placeholder-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-[#E86591] text-xs text-slate-900 font-medium placeholder-slate-400 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-gradient-to-r from-[#E86591] to-[#38BDF8] hover:from-[#DF5483] hover:to-[#0284C7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all shadow-pink-500/20"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account yet?{" "}
              <Link
                href="/register"
                className="font-bold text-[#E86591] hover:text-[#0284C7] transition-colors"
              >
                Register a new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5F8] via-[#F8FBFE] to-[#F1F6FB] flex flex-col justify-center items-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E86591] border-t-transparent" />
        <span className="text-xs text-slate-500 mt-2 font-medium">Loading sign-in...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
