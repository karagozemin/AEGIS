import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Aegis Prime | Confidential RWA Risk Engine",
  description:
    "Privacy-preserving risk assessment for Real World Assets using Trusted Execution Environments and Monte Carlo simulations.",
  keywords: [
    "RWA",
    "DeFi",
    "Privacy",
    "TEE",
    "Value at Risk",
    "Monte Carlo",
    "iExec",
  ],
  icons: {
    icon: [
      { url: "/aegis-logo.png", sizes: "64x64", type: "image/png" },
      { url: "/aegis-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/aegis-logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/aegis-logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/aegis-logo.png"],
  },
  openGraph: {
    title: "Aegis Prime | Confidential RWA Risk Engine",
    description: "Privacy-preserving risk assessment for Real World Assets using TEE",
    images: ["/aegis-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis Prime | Confidential RWA Risk Engine",
    description: "Privacy-preserving risk assessment for Real World Assets using TEE",
    images: ["/aegis-logo.png"],
    creator: "@Kaptan_web3",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
