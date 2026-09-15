import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — ${APP_CONFIG.nameKo}`,
  description: APP_CONFIG.description,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: `${APP_CONFIG.name} — ${APP_CONFIG.nameKo}`,
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
    title: `${APP_CONFIG.name} — ${APP_CONFIG.nameKo}`,
    description: APP_CONFIG.description,
    images: ["/og.png"],
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
