import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "BlogFlow AI — AI-Powered Content Automation",
  description:
    "Automate blog creation with AI. Research topics, generate SEO-optimized content, manage approvals, and publish directly to your CMS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

