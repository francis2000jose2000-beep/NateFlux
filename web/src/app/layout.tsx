import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LiquidChrome from "@/components/LiquidChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NateFlux",
  description:
    "NateFlux: A Unified DevSecOps Orchestrator for GitLab & HCP Terraform.",
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
        <div className="fixed inset-0 -z-[1] h-screen w-screen">
          <LiquidChrome 
            baseColor={[0.1, 0.1, 0.1]}
            speed={0.35}
            amplitude={0.3}
            frequencyX={3}
            frequencyY={3}
            interactive={false}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
