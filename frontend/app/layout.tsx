import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModerationFlow AI",
  description:
    "Sistema de moderação assistida por IA com LangGraph, Human-in-the-Loop e auditoria.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
