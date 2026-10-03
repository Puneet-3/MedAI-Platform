import { auth } from "@/auth";
import Link from "next/link";
import { 
  Activity, 
  Bot, 
  FileText, 
  Video, 
  MapPin, 
  BrainCircuit, 
  CheckCircle2, 
  UserCheck, 
  ChevronRight,
  Lock,
  Building2,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name || "User";

  return (
    <div className="min-h-screen bg-[#858476] p-3 sm:p-6 md:p-10 lg:p-12 font-sans transition-all duration-300">
      {/* Central Floating Editorial Canvas */}
      <main className="bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl w-full max-w-[1280px] mx-auto flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-hidden space-y-20">
        
        {/* Header Navigation Section */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
          {/* Site Title / Logo */}
          <Link href="/" className="inline-block group">
            <span className="font-serif text-2xl sm:text-[28px] font-normal text-neutral-900 tracking-tight group-hover:opacity-75 transition-opacity">
              MedAI
            </span>
          </Link>

          {/* Navigation Links & Action */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-normal text-neutral-800">
              <Link href="/dashboard" className="hover:text-black transition-colors">
                About
              </Link>
              <Link href="/dashboard/nearby" className="hover:text-black transition-colors">
                Contact
              </Link>
              <Link href="/dashboard/symptom-checker" className="hover:text-black transition-colors">
                Services
              </Link>
              <Link href="/dashboard/consultations" className="hover:text-black transition-colors">
                Appointments
              </Link>
            </nav>

            {/* Book Now Button */}
            <div>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium tracking-wide transition-all shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard/symptom-checker"
                  className="inline-flex items-center justify-center px-7 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium tracking-wide transition-all shadow-sm"
                >
                  Book now
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* 1. Hero Section (Matching Exact Template) */}
        <section className="pt-4 pb-2 space-y-10">
          {/* Giant Full-Width Editorial Headline */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[84px] xl:text-[94px] font-normal tracking-tight text-neutral-900 leading-[1.04]">
            Elevated Wellness, Tailored
          </h1>

          {/* 2-Column Split below headline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-2">
            
            {/* Left Column: Lowered Descriptor Text & Black Oval Discover Button */}
            <div className="lg:col-span-6 flex flex-col justify-end pb-4 space-y-6">
              <p className="text-base sm:text-lg text-neutral-800 font-normal leading-relaxed max-w-sm">
                Curated health essentials and personalized guidance for the discerning individual.
              </p>

              <div>
                <Link
                  href="/dashboard/symptom-checker"
                  className="inline-flex items-center justify-center px-10 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium tracking-wider transition-all shadow-sm"
                >
                  Discover
                </Link>
              </div>
            </div>

            {/* Right Column: Clean Vertical Interior Photograph */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/4.5] sm:aspect-[4/4.2] w-full max-w-md ml-auto bg-neutral-100">
                <img
                  src="/hero_interior.png"
                  alt="Elevated Wellness Space"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </section>

        {/* 2. Curated Services & Clinical Capabilities */}
        <section className="space-y-12 pt-8 border-t border-neutral-100">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                Personalized Care
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 tracking-tight font-normal">
                Curated Clinical Capabilities
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
              Designed for individuals seeking serene, instant health triage and medical professionals requiring streamlined care tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-2xl p-7 hover:bg-white hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-[#E86591] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
                  Symptom Triage Analysis
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Select parameters across 132 physical symptoms. Our medical diagnostic model calculates differential likelihoods and specialist triage recommendations.
                </p>
              </div>
              <Link href="/dashboard/symptom-checker" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-[#E86591] transition-colors">
                <span>Run Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Service 2 */}
            <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-2xl p-7 hover:bg-white hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-[#0284C7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
                  24/7 Wellness Assistant
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Trained on clinical consultation intents to answer health questions, explain drug interactions, and clarify symptoms with calm clarity.
                </p>
              </div>
              <Link href="/dashboard/chatbot" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-[#0284C7] transition-colors">
                <span>Start Dialogue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Service 3 */}
            <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-2xl p-7 hover:bg-white hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-[#E86591] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
                  Chest X-Ray Pre-Screening
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Upload pulmonary radiographs for deep neural analysis to pre-screen for pneumonia patterns and clinical indicators for doctor review.
                </p>
              </div>
              <Link href="/dashboard/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-[#E86591] transition-colors">
                <span>Upload Scan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Service 4 */}
            <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-2xl p-7 hover:bg-white hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-[#0284C7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
                  Physician Consultations
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Connect directly with licensed physicians via private consultation rooms, virtual waiting queues, and encrypted real-time chat.
                </p>
              </div>
              <Link href="/dashboard/consultations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-[#0284C7] transition-colors">
                <span>Enter Room</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Service 5 */}
            <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-2xl p-7 hover:bg-white hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-[#E86591] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
                  Nearby Care Finder
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Locate nearby specialized clinics, hospitals, and licensed dispensaries in real time utilizing browser geolocation.
                </p>
              </div>
              <Link href="/dashboard/nearby" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-[#E86591] transition-colors">
                <span>Locate Clinics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Service 6 */}
            <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-2xl p-7 hover:bg-white hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-[#0284C7] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
                  Digital Prescriptions & Records
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Receive official PDF medical prescriptions generated during physician consultations and access encrypted report archives.
                </p>
              </div>
              <Link href="/dashboard/history" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-[#0284C7] transition-colors">
                <span>View Records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3. The 4-Step Patient Pathway */}
        <section className="bg-neutral-50 border border-neutral-200/70 rounded-3xl p-8 sm:p-12 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Workflow
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
              A Seamless Journey to Verified Care
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600">
              Four gentle steps connecting initial symptom expression with licensed physician treatment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-serif text-2xl font-normal text-neutral-900 mb-3 block">01</span>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">Check Symptoms</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Select your current physical symptoms or upload chest scans.
                </p>
              </div>
              <span className="text-[11px] text-neutral-400 mt-4 pt-4 border-t border-neutral-100">132 conditions mapped</span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-serif text-2xl font-normal text-neutral-900 mb-3 block">02</span>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">Receive Triage Score</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  View differential condition likelihoods and recommended labs.
                </p>
              </div>
              <span className="text-[11px] text-neutral-400 mt-4 pt-4 border-t border-neutral-100">Sub-second analysis</span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-serif text-2xl font-normal text-neutral-900 mb-3 block">03</span>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">Doctor Consultation</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Enter the virtual room for physician assessment.
                </p>
              </div>
              <span className="text-[11px] text-neutral-400 mt-4 pt-4 border-t border-neutral-100">Board-certified review</span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-neutral-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-serif text-2xl font-normal text-neutral-900 mb-3 block">04</span>
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">Digital Prescription</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Receive signed medical PDF prescriptions and pharmacy routes.
                </p>
              </div>
              <span className="text-[11px] text-neutral-400 mt-4 pt-4 border-t border-neutral-100">Instant PDF download</span>
            </div>
          </div>
        </section>

        {/* 4. Dual Portals: Patients & Physicians */}
        <section className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Workspaces
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
              Dedicated Portals for Both Sides of Care
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Patient Portal Card */}
            <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-pink-300" />
                  <span>For Patients</span>
                </span>
                <h3 className="font-serif text-3xl font-normal text-white">
                  Empowered Personal Health Management
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Gain immediate clarity on symptoms, consult with an empathetic doctor, and secure verified prescriptions without sitting in crowded clinics.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pink-300 flex-shrink-0" />
                    <span>Instant symptom analysis with top-3 disease likelihood</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pink-300 flex-shrink-0" />
                    <span>24/7 Virtual health dialogue for medication & lifestyle guidance</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-pink-300 flex-shrink-0" />
                    <span>One-click doctor consultation & downloadable prescriptions</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-neutral-800">
                <Link
                  href="/dashboard/symptom-checker"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-black text-xs font-semibold tracking-wider hover:bg-neutral-200 transition-all"
                >
                  Start Self-Check
                </Link>
              </div>
            </div>

            {/* Doctor Portal Card */}
            <div className="bg-[#173364] text-white rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-medium">
                  <Activity className="w-3.5 h-3.5 text-sky-300" />
                  <span>For Clinicians</span>
                </span>
                <h3 className="font-serif text-3xl font-normal text-white">
                  A High-Efficiency Clinical Workstation
                </h3>
                <p className="text-xs sm:text-sm text-sky-100/80 leading-relaxed">
                  Review pre-screened waiting queues, evaluate automated radiographic indicators, conduct live consultations, and issue verifiable digital prescriptions.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-sky-100/90">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-300 flex-shrink-0" />
                    <span>Live patient queue prioritized by symptom urgency score</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-300 flex-shrink-0" />
                    <span>Deep learning pre-screening assistant for pulmonary radiographs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-300 flex-shrink-0" />
                    <span>Integrated digital prescription generator with tamper audit log</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#234685]">
                <Link
                  href="/doctor/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-[#173364] text-xs font-semibold tracking-wider hover:bg-sky-50 transition-all"
                >
                  Open Workstation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Frequently Asked Questions */}
        <section className="space-y-8 max-w-4xl mx-auto w-full pt-4">
          <div className="text-center space-y-2">
            <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              FAQ
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            <details className="group bg-neutral-50 border border-neutral-200/70 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-medium text-sm text-neutral-900">
                <span>Is MedAI a replacement for an in-person physical doctor?</span>
                <span className="ml-2 text-neutral-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/60 pt-3">
                No. MedAI provides preliminary machine learning risk analysis and Virtual AI assistant guidance to assist triage. It is designed to connect you with certified medical professionals who perform final evaluations.
              </p>
            </details>

            <details className="group bg-neutral-50 border border-neutral-200/70 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-medium text-sm text-neutral-900">
                <span>How accurate are the symptom triage and radiography models?</span>
                <span className="ml-2 text-neutral-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/60 pt-3">
                Our Random Forest symptom classifier covers 132 symptoms, and our CNN model is trained specifically for pulmonary X-ray analysis. If confidence scores fall below thresholds (e.g. 60%), MedAI explicitly recommends laboratory blood work or doctor evaluation.
              </p>
            </details>

            <details className="group bg-neutral-50 border border-neutral-200/70 rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-medium text-sm text-neutral-900">
                <span>How do live consultations with doctors work?</span>
                <span className="ml-2 text-neutral-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-xs text-neutral-600 leading-relaxed border-t border-neutral-200/60 pt-3">
                When you initiate a consultation, your profile and symptom results are queued in the doctor workstation. Once a physician accepts your request, a real-time session opens where you can discuss symptoms and receive a digital prescription.
              </p>
            </details>
          </div>
        </section>

        {/* 6. Editorial Footer */}
        <footer className="pt-8 border-t border-neutral-100 text-xs text-neutral-500 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-xl font-normal text-neutral-900 tracking-tight group-hover:opacity-75 transition-opacity">
                MedAI
              </span>
            </Link>
            <div className="flex items-center gap-6 text-neutral-600">
              <Link href="/dashboard/symptom-checker" className="hover:text-black transition-colors">Symptom Checker</Link>
              <Link href="/dashboard/chatbot" className="hover:text-black transition-colors">AI Assistant</Link>
              <Link href="/doctor/dashboard" className="hover:text-black transition-colors">Clinicians</Link>
              <Link href="/login" className="hover:text-black transition-colors">Sign In</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-neutral-100 text-[11px] text-neutral-400">
            <p>© {new Date().getFullYear()} MedAI Health Technologies. All rights reserved.</p>
            <p>Elevated Wellness, Tailored.</p>
          </div>
        </footer>

      </main>
    </div>
  );
}
