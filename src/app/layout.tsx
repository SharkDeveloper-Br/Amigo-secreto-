import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { Gift } from "lucide-react";
import { Snowflakes } from "@/components/snowflakes";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Amigo Secreto", template: "%s · Amigo Secreto" },
  description: "Organize o amigo secreto: sorteio com regras, link secreto e lista de desejos.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1a15" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col">
        <Snowflakes />
        <header className="relative mx-auto flex w-full max-w-[640px] items-center px-4 pt-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 font-display text-lg font-semibold"
          >
            <Gift className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
            Amigo Secreto
          </Link>
        </header>
        <main className="relative mx-auto w-full max-w-[640px] flex-1 px-4 pb-16 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
