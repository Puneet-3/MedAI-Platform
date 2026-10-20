import { auth } from "@/auth";
import { REPORT_MAX_MB } from "@/lib/report-limits";
import Link from "next/link";
import Image from "next/image";
import { Activity, ArrowDown, ArrowRight, Bot, FileText, HeartHandshake, MapPin, MessageCircle, Plus, Stethoscope } from "lucide-react";

const services = [
  { title: "Make sense of your symptoms", description: "Choose what you are feeling and explore possible matches. Bring your results to a doctor for a proper assessment.", href: "/dashboard/symptom-checker", action: "Check symptoms", icon: Activity, number: "01" },
  { title: "A place for your questions", description: "Ask the health assistant a general question. It uses a set of prepared responses and will tell you when it cannot help.", href: "/dashboard/chatbot", action: "Ask a question", icon: Bot, number: "02" },
  { title: "Keep your reports together", description: "Upload a report, find it again when you need it, and read the notes a doctor leaves after reviewing it.", href: "/dashboard/reports", action: "View reports", icon: FileText, number: "03" },
  { title: "Talk it through with a doctor", description: "Join the waiting room for a text consultation. Your conversation and the doctor's treatment notes stay together.", href: "/dashboard/consultations", action: "Request a consultation", icon: MessageCircle, number: "04" },
  { title: "Find care close to you", description: "Look for hospitals, clinics, and pharmacies around your location, with directions to help you get there.", href: "/dashboard/nearby", action: "Find nearby care", icon: MapPin, number: "05" },
  { title: "Pick up where you left off", description: "Look back at earlier symptom checks and consultation notes without having to remember every detail.", href: "/dashboard/history", action: "See your history", icon: HeartHandshake, number: "06" },
];
const questions = [
  ["Can MedAI give me a diagnosis?", "No. The symptom checker is an experimental machine learning tool. Its scores describe model matches, not your chance of having an illness. A qualified doctor needs to assess your symptoms and medical history."],
  ["What happens when I request a consultation?", "Your request enters a waiting room. When a doctor accepts it, you can chat by text. The doctor can add treatment notes, which you can download afterwards. Response time depends on whether a doctor is available."],
  ["Can I upload any medical report?", `You can save JPG, PNG, and PDF reports up to ${REPORT_MAX_MB} MB. Chest X-ray screening accepts JPG and PNG only and is available when a trained model is installed. Reports can still be reviewed by a doctor when screening is unavailable.`],
  ["Who is this project for?", "MedAI is a healthcare software project for learning and demonstration. It has patient, doctor, and administrator workspaces. It has not been clinically validated and is not an emergency service."],
];

export default async function Home() {
  const session = await auth();
  const workspace = session?.user?.role === "DOCTOR" ? "/doctor/dashboard" : session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
  return (
    <div className="landing min-h-screen bg-[#f5f3ed] text-[#233c36]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-6 md:px-12">
        <Link href="/" className="flex items-center gap-2.5" aria-label="MedAI home">
          <Image src="/logo.png" alt="" width={34} height={34} className="size-[34px] shrink-0 object-contain" />
          <span className="font-serif text-3xl tracking-tight">MedAI<span className="text-[#71866a]">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm md:gap-8">
          <a href="#care" className="hidden hover:underline sm:block">Ways we can help</a>
          <a href="#how-it-works" className="hidden hover:underline md:block">How it works</a>
          <Link href={session ? workspace : "/login"} className="hover:underline">{session ? "Your workspace" : "Sign in"}</Link>
          <Link href={session ? workspace : "/register"} className="rounded-full bg-[#294e42] px-5 py-3 text-white transition hover:bg-[#1d3c32]">{session ? "Open dashboard" : "Get started"} <ArrowRight className="ml-1 inline size-4" /></Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-10 md:px-12 md:pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-16">
          <div className="max-w-xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#61725b]"><span className="size-2 rounded-full bg-[#71866a]" /> A little clarity. A little care.</p>
            <h1 className="font-serif text-5xl leading-[1.07] tracking-tight sm:text-6xl xl:text-[78px]">Your health deserves<br /><em className="font-normal text-[#71866a]">a conversation.</em></h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-[#63716a] md:text-lg">Some days, you just need to know where to start. Understand your symptoms, keep your reports close, and take the next step with a doctor.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/dashboard/symptom-checker" className="inline-flex items-center gap-3 rounded-full bg-[#294e42] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#1d3c32]">Start with your symptoms <ArrowRight className="size-4" /></Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 text-sm underline decoration-[#a5b09b] underline-offset-4">Take a look around <ArrowDown className="size-4" /></a>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-[#738075]">A starting point for better questions. Every medical decision belongs with you and your doctor.</p>
          </div>
          <div className="relative pb-8 pl-3 sm:pl-8">
            <div className="absolute inset-x-0 bottom-0 top-8 rounded-[2rem] bg-[#dce2d4]" />
            <div className="relative aspect-[5/5] overflow-hidden rounded-[2rem] sm:aspect-[6/5] lg:aspect-[5/5]">
              <Image src="/doctor_hero.jpg" alt="A healthcare professional ready for a conversation" fill priority sizes="(max-width: 1024px) 90vw, 540px" className="object-cover" />
            </div>
            <div className="absolute bottom-2 left-0 flex max-w-[85%] items-center gap-4 rounded-2xl border border-[#e6e7dc] bg-[#fffefa] px-5 py-4 shadow-sm">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#edf1e7]"><HeartHandshake className="size-5 text-[#577248]" /></span>
              <div><p className="font-serif text-xl">A person behind every question.</p><p className="mt-1 text-xs text-[#738075]">Technology helps. Human judgment matters.</p></div>
            </div>
          </div>
        </section>
        <section id="care" className="border-y border-[#e3e4d9] bg-[#fffefa]">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">A few ways to feel more prepared</p><h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Small steps. A clearer picture.</h2></div><p className="max-w-xs text-sm leading-relaxed text-[#738075]">From the first question to a follow-up conversation, keep the details in one place.</p></div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-[#e3e4d9] bg-[#e3e4d9] sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ title, description, href, action, icon: Icon, number }) => <article key={number} className="group flex flex-col bg-[#fffefa] p-7 transition hover:bg-[#f5f6ef] md:p-8"><div className="mb-7 flex items-center justify-between"><Icon className="size-6 stroke-[1.5] text-[#617d54]" /><span className="font-mono text-xs text-[#9ba593]">{number}</span></div><h3 className="font-serif text-2xl leading-tight">{title}</h3><p className="mb-6 mt-3 flex-1 text-sm leading-relaxed text-[#738075]">{description}</p><Link href={href} className="inline-flex items-center gap-2 text-sm font-medium underline decoration-[#d3dbc9] underline-offset-4">{action}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></article>)}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
          <p className="eyebrow">At your own pace</p><h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">You do not need all the answers.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">{[["01", "Start with what you know", "Create your account and choose the symptoms that describe how you feel."], ["02", "Keep the details together", "Save a symptom check or upload a report so you have something to refer back to."], ["03", "Bring a doctor into the conversation", "Request a text consultation, ask your questions, and keep the doctor's notes."]].map(([n, title, description]) => <div key={n} className="border-t border-[#cfd5c7] pt-5"><span className="text-xs text-[#71866a]">{n}</span><h3 className="mt-4 font-serif text-2xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[#738075]">{description}</p></div>)}</div>
        </section>
        <section className="mx-auto max-w-7xl px-6 pb-16 md:px-12"><div className="grid gap-6 rounded-3xl bg-[#294e42] p-8 text-[#fffefa] md:grid-cols-[1fr_auto] md:items-center md:p-12"><div><div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-[#c4d3ba]"><Stethoscope className="size-4" /> For doctors</div><h2 className="font-serif text-3xl md:text-4xl">More context for the conversation.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#d3dfd2]">A shared waiting room, patient symptom history, report reviews, and consultation notes. Doctor access is managed by a project administrator.</p></div><Link href="/doctor/dashboard" className="inline-flex w-fit items-center gap-3 rounded-full border border-[#799381] px-6 py-3 text-sm transition hover:bg-[#365e50]">Open doctor workspace <ArrowRight className="size-4" /></Link></div></section>
        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 md:grid-cols-[1fr_1.4fr] md:px-12 md:pb-24"><div><p className="eyebrow">Before you begin</p><h2 className="mt-3 font-serif text-4xl tracking-tight">A few things<br />you might wonder.</h2></div><div>{questions.map(([question, answer]) => <details key={question} className="group border-b border-[#d8ddcf] py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">{question}<Plus className="size-4 shrink-0 transition group-open:rotate-45" /></summary><p className="mt-4 pr-6 text-sm leading-relaxed text-[#63716a]">{answer}</p></details>)}</div></section>
      </main>
      <footer className="border-t border-[#d8ddcf] px-6 py-8 md:px-12"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 sm:flex-row"><div><Link href="/" className="font-serif text-2xl">MedAI.</Link><p className="mt-2 max-w-md text-xs leading-relaxed text-[#738075]">Built as a healthcare software project. Experimental tools, human decisions.<br />For urgent help, contact your local emergency service.</p></div><nav aria-label="Footer" className="flex flex-wrap items-start gap-6 text-sm"><a href="#care">Explore</a><a href="#how-it-works">How it works</a><Link href="/login">Sign in</Link><Link href="/register">Create account</Link></nav></div><p className="mx-auto mt-8 max-w-6xl text-xs text-[#738075]">&copy; {new Date().getFullYear()} MedAI</p></footer>
    </div>
  );
}
