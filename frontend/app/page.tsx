import { auth } from "@/auth";
import Link from "next/link";
import { 
  Heart, 
  LogIn, 
  ArrowRight, 
  Activity, 
  Bot, 
  FileText, 
  Video, 
  MapPin, 
  ShieldCheck, 
  Stethoscope, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  UserCheck, 
  ChevronRight,
  Zap,
  Lock,
  Building2
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name || "User";

  return (
    <div className="min-h-screen bg-[#FAF9F5] p-3 sm:p-6 md:p-10 lg:p-12 font-sans transition-all duration-300">
      {/* Central Floating Container */}
      <main className="bg-white border border-neutral-100 rounded-3xl shadow-xl w-full max-w-8xl mx-auto flex flex-col justify-between p-5 sm:p-8 md:p-12 overflow-hidden space-y-16">
        
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

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-2 text-xs font-bold text-neutral-600 tracking-widest">
            <Link href="/" className="text-emerald-600 uppercase">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold tracking-wider text-emerald-900 uppercase transition-all"
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

        {/* 1. Hero Grid Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-4 items-center">
          {/* Left Column: Soft Mint Green Illustration Frame */}
          <div className="relative bg-[#ECFDF5] rounded-3xl p-6 sm:p-10 flex items-center justify-center border border-emerald-100/50 shadow-sm transition-all duration-300 group">
            <img
              src="/medical_professionals_hero.png"
              alt="Medical Professionals Illustration"
              className="max-h-[380px] w-auto object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            {/* Floating Badge */}
            <div className="absolute -bottom-4 bg-white border border-emerald-100 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">PyTorch & ML Engine</p>
                <p className="text-[10px] text-neutral-500 font-medium">Real-time Diagnostic AI</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 pt-4 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Smart Health Platform</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              AI-Powered <br className="hidden sm:inline" />
              Healthcare Companion
            </h2>
            
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed max-w-lg">
              MedAI merges advanced machine learning with clinical workflows. Get instant, accurate symptom analysis, chat with our virtual assistant for medical guidance, and transition seamlessly into live consultations with doctors—all on one secure platform.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 w-full">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-transparent text-xs font-bold uppercase tracking-widest rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/10"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-transparent text-xs font-bold uppercase tracking-widest rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/10"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link
                href="/dashboard/symptom-checker"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-200 text-xs font-bold uppercase tracking-widest rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Try Symptom Checker</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-neutral-100 w-full max-w-md">
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">132+</p>
                <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Symptoms</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">98%</p>
                <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">ML Accuracy</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">24/7</p>
                <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Virtual Triage</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Core Capabilities Grid Section */}
        <section className="space-y-10 pt-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Platform Features</span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Comprehensive Health Capabilities
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Designed for patients seeking fast insights and medical professionals requiring streamlined clinical tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">AI Symptom Predictor</h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Select parameters across 132 clinical symptoms. Our Random Forest machine learning backend outputs top disease probabilities and specialist triage recommendations.
              </p>
              <Link href="/dashboard/symptom-checker" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">
                <span>Run Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">24/7 AI Health Assistant</h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Powered by NLTK stemming and a multilayer perceptron classifier. Trained on 60+ medical intents to answer health questions and clarify symptoms instantly.
              </p>
              <Link href="/dashboard/chatbot" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">
                <span>Start Chat</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Chest X-Ray Pre-Screening</h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Upload pulmonary X-ray images for automated PyTorch MobileNetV2 CNN neural analysis to pre-screen for pneumonia patterns and clinical indicators.
              </p>
              <Link href="/dashboard/xray-analysis" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">
                <span>Upload Scan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Real-Time Doctor Consultations</h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Connect directly with licensed physicians via Socket.io powered live consultation rooms, virtual waiting queues, and instant messaging.
              </p>
              <Link href="/dashboard/consultation" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">
                <span>Enter Consultation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Nearby Facility Finder</h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Find nearby hospitals, specialized clinics, and pharmacies in real-time utilizing integrated browser geolocation and Google Places API endpoints.
              </p>
              <Link href="/dashboard/facility-finder" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">
                <span>Locate Clinics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Digital Prescriptions & Records</h4>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Receive official PDF medical prescriptions generated during consultations and access encrypted report history backed by Supabase storage.
              </p>
              <Link href="/dashboard/history" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">
                <span>View Records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3. How MedAI Works (Step-by-Step Workflow) */}
        <section className="bg-[#ECFDF5] border border-emerald-100 rounded-3xl p-8 sm:p-12 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Seamless Workflow</span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How MedAI Protects Your Health
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Four simple steps bridging AI insights with real doctor care.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/70 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center mb-4">1</span>
                <h4 className="text-base font-bold text-slate-900 mb-2">Check Symptoms</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Select your current symptoms or upload chest X-rays to trigger our machine learning diagnostic pipeline.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
                132 Symptoms Supported
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/70 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center mb-4">2</span>
                <h4 className="text-base font-bold text-slate-900 mb-2">Get AI Diagnostic Score</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  FastAPI runs inference models to provide potential condition matches, confidence rates, and recommended labs.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
                Sub-second Prediction
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/70 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center mb-4">3</span>
                <h4 className="text-base font-bold text-slate-900 mb-2">Live Doctor Consultation</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Enter the virtual waiting room and consult with certified doctors in real time via Socket.io messaging.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
                Real-Time Socket Sync
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100/70 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center mb-4">4</span>
                <h4 className="text-base font-bold text-slate-900 mb-2">Receive PDF Prescription</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Download official digital prescriptions signed by your consulting physician and locate nearby dispensaries.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
                Instant PDF Export
              </div>
            </div>
          </div>
        </section>

        {/* 4. Dual Portal Showcase (Patient vs Doctor) */}
        <section className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Built for Everyone</span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tailored Portals for Patients & Physicians
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Patient Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" />
                  <span>Patient Experience</span>
                </div>
                <h4 className="text-2xl font-black">Empowered Personal Health Management</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Get fast clarity on symptoms, chat with an empathetic AI assistant anytime, and secure real-time doctor advice without sitting in crowded hospital waiting rooms.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Instant symptom analysis with top-3 disease likelihood</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>24/7 Virtual AI Assistant for medication & symptom queries</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>One-click doctor consultation & downloadable prescriptions</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <Link
                  href="/dashboard/symptom-checker"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold uppercase tracking-widest text-white transition-colors"
                >
                  <span>Start Patient Self-Check</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Doctor Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4" />
                  <span>Clinical Workstation</span>
                </div>
                <h4 className="text-2xl font-black">AI-Assisted Workflows for Doctors</h4>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Review pre-screened patient waiting queues, analyze AI X-ray diagnostic outputs, conduct live consultation chats, and issue digital prescriptions seamlessly.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-center gap-3 text-xs text-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Live patient queue sorted by symptom urgency score</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs text-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>PyTorch CNN X-Ray assistant for pre-screening pneumonia</span>
                  </li>
                  <li className="flex items-center gap-3 text-xs text-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Integrated digital prescription generator with history log</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-emerald-800">
                <Link
                  href="/doctor/queue"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-emerald-50 text-xs font-bold uppercase tracking-widest text-emerald-950 transition-colors"
                >
                  <span>Open Doctor Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Metrics & Security Banner */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-sm font-bold mb-1">Encrypted Data</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Supabase database encryption protecting patient records and reports.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-sm font-bold mb-1">Sub-Second Inference</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  FastAPI microservices executing PyTorch and scikit-learn models in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-sm font-bold mb-1">Clinical Safety</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Built-in fallback triggers when prediction confidence falls below 60%.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-sm font-bold mb-1">Location Intelligence</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Google Places API integration for pinpointing hospitals and pharmacies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Frequently Asked Questions (FAQ) Section */}
        <section className="space-y-8 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Got Questions?</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            <details className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-bold text-sm text-slate-900">
                <span>Is MedAI a replacement for seeing a physical doctor?</span>
                <span className="ml-2 text-emerald-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-slate-200/60 pt-3">
                No. MedAI provides preliminary machine learning risk analysis and Virtual AI assistant guidance to assist triage. It is designed to connect you with certified medical professionals who perform final evaluations.
              </p>
            </details>

            <details className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-bold text-sm text-slate-900">
                <span>How accurate are the AI Symptom Checker and Chest X-Ray models?</span>
                <span className="ml-2 text-emerald-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-slate-200/60 pt-3">
                Our Random Forest symptom classifier covers 132 symptoms, and our PyTorch MobileNetV2 CNN model is trained specifically for pulmonary X-ray analysis. If confidence scores fall below thresholds (e.g. 60%), MedAI explicitly recommends laboratory blood work or doctor evaluation.
              </p>
            </details>

            <details className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-bold text-sm text-slate-900">
                <span>How do live consultations with doctors work on MedAI?</span>
                <span className="ml-2 text-emerald-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-slate-200/60 pt-3">
                When you initiate a consultation, your profile and symptom results are queued in the doctor workstation. Once a physician accepts your request, a real-time Socket.io chat session opens where you can discuss symptoms and receive a digital prescription.
              </p>
            </details>

            <details className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-bold text-sm text-slate-900">
                <span>Is my medical information secure?</span>
                <span className="ml-2 text-emerald-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-slate-200/60 pt-3">
                Yes. All user accounts, consultation histories, and uploaded medical documents are protected via Supabase authentication protocols and private cloud storage buckets.
              </p>
            </details>
          </div>
        </section>

        {/* 7. Call To Action (CTA) Banner */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl shadow-emerald-600/10">
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Take Control of Your Health Journey?
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Join thousands of users accessing instant AI diagnostics and seamless virtual doctor consultations today.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-emerald-850 hover:bg-emerald-50 text-xs font-bold uppercase tracking-widest transition-all shadow-md"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-widest transition-all shadow-md"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>

        {/* 8. Enhanced Footer Section */}
        <footer className="pt-8 border-t border-neutral-100 space-y-8 text-xs text-slate-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-emerald-600 text-white">
                  <Heart className="h-4 w-4 fill-current" />
                </div>
                <span className="font-black text-slate-900 tracking-widest text-sm uppercase">MedAI</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
                Smart health consultation platform integrating PyTorch CNN image models, scikit-learn symptom analysis, and Socket.io doctor consultations.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Navigation</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard/symptom-checker" className="hover:text-emerald-600 transition-colors">Symptom Predictor</Link></li>
                <li><Link href="/dashboard/chatbot" className="hover:text-emerald-600 transition-colors">AI Health Assistant</Link></li>
                <li><Link href="/dashboard/xray-analysis" className="hover:text-emerald-600 transition-colors">Chest X-Ray Pre-Screening</Link></li>
                <li><Link href="/dashboard/facility-finder" className="hover:text-emerald-600 transition-colors">Nearby Facilities</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3">Portals</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/login" className="hover:text-emerald-600 transition-colors">Patient Login</Link></li>
                <li><Link href="/doctor/queue" className="hover:text-emerald-600 transition-colors">Doctor Workstation</Link></li>
                <li><Link href="/admin" className="hover:text-emerald-600 transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>
          </div>

          {/* Medical Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-amber-950 block mb-1">⚠️ Medical Disclaimer:</span>
            MedAI is an artificial intelligence-assisted consultation system meant for informational triage purposes only. It does not replace professional medical diagnosis, advice, or treatment. If you are experiencing a life-threatening medical emergency, please call your local emergency services (e.g., 911) or visit the nearest emergency room immediately.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} MedAI Platform. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-emerald-600 transition-colors">Security Overview</Link>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
