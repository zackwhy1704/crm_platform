import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "CRM Platform — AI Lead Qualification for SG SMEs",
  description: "AI-powered lead qualification and client management for Singapore SMEs. Pilot niche: renovation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
