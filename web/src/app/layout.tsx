import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PixelSnow from "@/components/PixelSnow";

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
        <div className="fixed inset-0 -z-10 h-screen w-screen bg-black">
          <PixelSnow
            color="#ffffff"
            flakeSize={0.009}
            minFlakeSize={1.25}
            pixelResolution={200}
            speed={0.85}
            depthFade={8}
            farPlane={20}
            brightness={1}
            gamma={0.4545}
            density={0.3}
            variant="square"
            direction={125}
          />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
