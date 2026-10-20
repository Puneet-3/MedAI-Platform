"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getProviders } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    getProviders().then(providers => { if (active) setGoogleAvailable(!!providers?.google); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const registered = searchParams.get("registered") === "true" && !dismissed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDismissed(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role,
      });

      if (res?.error) {
        throw new Error(res.error === "CredentialsSignin" ? "Check your email, password, and selected role." : "Sign-in is unavailable at the moment. Please try again shortly.");
      }

      const callback = searchParams.get("callbackUrl");
      router.push(callback?.startsWith("/") && !callback.startsWith("//") && !callback.includes("\\") ? callback : "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "") || "Authentication failed.");
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
              Sign in to your account
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Pick up where you left off.
            </p>
          </div>
        </div>

        {/* Clean Centered Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">

          {registered && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Account created.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="login-role" className="block text-xs font-medium text-neutral-700">Sign in as</label>
              <select id="login-role" name="role" required disabled={loading} value={role} onChange={(event) => { setRole(event.target.value); setError(null); }} className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#66835b]">
                <option value="" disabled>Choose your role</option>
                <option value="USER">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-neutral-700">
                Email
              </label>
              <input
                id="login-email" name="email" autoComplete="username" type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#66835b] focus:border-neutral-900 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-medium text-neutral-700">
                  Password
                </label>
              </div>
              <input
                id="login-password" name="password" autoComplete="current-password" type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#66835b] focus:border-neutral-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#294e42] hover:bg-[#1d3c32] disabled:bg-neutral-400 text-white text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {googleAvailable && <><button type="button" disabled={loading} onClick={async () => {
            setLoading(true); setError(null);
            try { await signIn("google", { redirectTo: "/dashboard" }); }
            catch { setError("Google sign-in couldn't be started. Please try again."); setLoading(false); }
          }} className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50">Continue with Google</button><p className="text-xs text-neutral-500">Google sign-in uses the role already assigned to your account.</p></>}

          <div className="pt-3 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-neutral-900 hover:underline underline-offset-4"
              >
                Register
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-page min-h-screen bg-[#f5f3ed] flex flex-col justify-center items-center font-sans">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-neutral-800 border-t-transparent" />
        <span className="text-xs text-neutral-500 mt-2 font-medium">Loading...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
