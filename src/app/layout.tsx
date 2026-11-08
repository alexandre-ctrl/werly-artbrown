import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Lato } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ArtBrown Company — Organização de Eventos e Casamentos",
    template: "%s | ArtBrown Company",
  },
  description:
    "Assessoria, cerimonial e organização de casamentos e eventos com elegância, cuidado e atenção a cada detalhe.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "ArtBrown Company",
  },
};

export const viewport: Viewport = {
  themeColor: "#A98F71",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${greatVibes.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
