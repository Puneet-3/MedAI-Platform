import Link from "next/link";
export default function NotFound() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f5f3ed] px-6 text-center text-[#233c36]"><p className="eyebrow">404</p><h1 className="font-serif text-4xl">A little off the path.</h1><p className="max-w-sm text-sm leading-relaxed text-neutral-500">We could not find that page. Your workspace is a good place to start again.</p><Link href="/" className="rounded-full bg-[#294e42] px-6 py-3 text-sm text-white">Back to MedAI</Link></main>;
}
