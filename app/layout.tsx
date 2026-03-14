import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./lib/language-context";
import { QueryProvider } from "./lib/query-provider";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "SIGINT // 국제 정세 모니터링",
  description: "국제 정세 모니터링 대시보드 — World Affairs Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem("sigint-theme") === "light") {
              document.documentElement.classList.add("light");
            }
          } catch(e) {}
        `}} />
      </head>
      <body
        className={`${ibmPlexMono.variable} ${notoSansKR.variable} antialiased`}
      >
        <QueryProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
