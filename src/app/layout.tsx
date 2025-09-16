import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import { ClientSessionProvider } from "@/components/session-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AddedSectionsProvider } from "@/contexts/added-sections-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased`}
      >
        <ClientSessionProvider>
          <AuthProvider>
            <AddedSectionsProvider>
              {children}
            </AddedSectionsProvider>
          </AuthProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
