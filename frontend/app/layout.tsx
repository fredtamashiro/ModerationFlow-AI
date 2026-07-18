import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://moderationflow.fredtamashiro.com.br"),
  title: "ModerationFlow AI",
  description:
    "Aplicação de moderação de conteúdo com agentes de IA, LangGraph e revisão humana.",
  openGraph: {
    type: "website",
    url: "/",
    title: "ModerationFlow AI",
    description:
      "Fluxo de moderação de conteúdo com agentes de IA, LangGraph e Human-in-the-Loop.",
    siteName: "ModerationFlow AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 627,
        alt: "ModerationFlow AI — IA, LangGraph e revisão humana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ModerationFlow AI",
    description: "Moderação de conteúdo com agentes de IA e revisão humana.",
    images: ["/og-image.png"],
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
