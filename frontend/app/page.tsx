import { auth } from "@/auth";
import Link from "next/link";
import { Heart, LogIn, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name || "User";

  return (
    <div className="min-h-screen bg-[#FAF9F5] p-4 sm:p-6 md:p-10 lg:p-12 flex items-center justify-center font-sans transition-all duration-300">
      {/* Central Floating Card Container - Widened to max-w-8xl */}
      <main className="bg-white border border-neutral-100 rounded-3xl shadow-xl w-full max-w-8xl min-h-[85vh] flex flex-col justify-between p-6 sm:p-8 md:p-12 overflow-hidden">
        
        {/* Header Navigation Section */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/10">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase leading-none">
                MedAI
              </h1>
            </div>
          </div>

          {/* Navigation Links - Widened spacing (gap-x-16) */}
          <nav className="flex flex-wrap items-center justify-center gap-x-16 gap-y-2 text-xs font-bold text-neutral-600 tracking-widest">
            <Link href="/" className="hover:text-emerald-600 transition-colors uppercase">
              Home
            </Link>
            <Link href="/dashboard/symptom-checker" className="hover:text-emerald-600 transition-colors uppercase">
              Symptom Checker
            </Link>
            <Link href="/dashboard/chatbot" className="hover:text-emerald-600 transition-colors uppercase">
              AI Assistant
            </Link>
            <Link href="/dashboard" className="hover:text-emerald-600 transition-colors uppercase">
              Dashboard
            </Link>
          </nav>

          {/* User Session CTA */}
          <div>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold tracking-wider text-emerald-850 uppercase transition-all"
              >
                <span>Hi, {userName.split(" ")[0]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold tracking-wider text-white uppercase transition-all shadow-md shadow-emerald-600/10"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </header>

        {/* Hero Grid Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-10 lg:py-16 items-center flex-1">
          {/* Left Column: Soft Mint Green Illustration Frame */}
          <div className="bg-[#ECFDF5] rounded-3xl p-6 sm:p-10 flex items-center justify-center border border-emerald-100/50 shadow-sm transition-all duration-300">
            <img
              src="/medical_professionals_hero.png"
              alt="Medical Professionals Illustration"
              className="max-h-[380px] w-auto object-contain rounded-2xl hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>

          {/* Right Column: Professional Clinical Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-lg">
              AI-Powered <br className="hidden sm:inline" />
              Healthcare Companion
            </h2>
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed max-w-lg">
              MedAI merges advanced machine learning with clinical workflows. Get instant, accurate symptom analysis, chat with our virtual assistant for medical guidance, and transition seamlessly into live consultations with doctors—all on one secure platform.
            </p>
            <div className="pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-xs font-bold uppercase tracking-widest rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/10"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-xs font-bold uppercase tracking-widest rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/10"
                >
                  Get Started
                </Link>
              )}
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block pt-2">
              #healthforall
            </span>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-6">
            {/* Twitter/X Icon */}
            <a href="#" className="hover:text-emerald-600 transition-colors" aria-label="Twitter">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            {/* Facebook Icon */}
            <a href="#" className="hover:text-emerald-600 transition-colors" aria-label="Facebook">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
              </svg>
            </a>
            {/* Instagram Icon */}
            <a href="#" className="hover:text-emerald-600 transition-colors" aria-label="Instagram">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 0i13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
          <p>© {new Date().getFullYear()} MedAI Platform. All rights reserved.</p>
        </footer>

      </main>
    </div>
  );
}
