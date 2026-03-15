import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Hyperspeed from "@/components/Hyperspeed";
import { hyperspeedPresets } from "@/components/HyperSpeedPresets";

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
    <html lang="en" style={{ backgroundColor: "#060010", color: "white" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: "#060010", color: "white" }}
      >
        <div
          className="fixed inset-0 -z-50 h-screen w-screen bg-[#060010]"
        />
        <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#060010]">
          <Hyperspeed effectOptions={hyperspeedPresets.one} />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
