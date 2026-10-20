import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MedAI | A clearer next step for your health", template: "%s | MedAI" },
  description: "Keep your symptoms, medical reports, and doctor conversations together. An experimental healthcare project built around people.",
  icons: {
    icon: [
      { url: "/icon.svg?v=medai-green-2", type: "image/svg+xml" },
      { url: "/icon.png?v=medai-green-2" },
      { url: "/favicon.ico?v=medai-green-2" },
    ],
    shortcut: "/favicon.ico?v=medai-green-2",
    apple: "/icon.png?v=medai-green-2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="h-full antialiased scroll-smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
