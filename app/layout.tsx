import type { Metadata } from "next/types";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Navigation from "@/components/Navigation";
import Providers from "@/app/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Leetcodle",
  description: "Daily Coding Problems inspired by Wordle"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            defer
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <Providers>
            <div className="mx-auto px-4 py-4 md:px-6 lg:px-8">
              <Navigation />
            </div>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
