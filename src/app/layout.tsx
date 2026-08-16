import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobPilot",
  description:
    "AI-powered job search assistance for matching roles, tailored resumes, and faster applications.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background">
        {user && <PostHogIdentify userId={user.id} />}
        {children}
      </body>
    </html>
  );
}
