import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientSessionProvider } from "@/components/session-provider";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dental RAG Web Interface",
  description: "AI-powered dental analysis and literature search platform for professional dental X-ray cephalometric analysis reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientSessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
