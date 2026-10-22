import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Self-e-Tape CRM",
  description: "Contact and email management for Self-e-Tape",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex h-screen bg-stone-100/50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div role="status" className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-950">Email sending is disabled while security checks are completed.</div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
