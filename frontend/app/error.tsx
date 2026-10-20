"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center"><h1 className="font-serif text-3xl">We hit a bump.</h1><p className="text-sm leading-relaxed text-neutral-500">This page could not load. Please try again in a moment. Your saved records will still be there.</p><div className="flex gap-4"><button onClick={reset} className="rounded-full bg-[#294e42] px-5 py-3 text-sm text-white">Try again</button><Link href="/" className="px-4 py-3 text-sm underline">Go home</Link></div></div>;
}
