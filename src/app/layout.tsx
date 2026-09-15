import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_CONFIG } from "@/config/app";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${APP_CONFIG.name} — ${APP_CONFIG.nameKo} | 영상 제작 견적 도구`,
  description: APP_CONFIG.description,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: `${APP_CONFIG.name} — 영상 제작 견적 도구`,
    description: APP_CONFIG.description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} — ${APP_CONFIG.nameKo}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.name} — 영상 제작 견적 도구`,
    description: APP_CONFIG.description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/semform-mark.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafafa",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
