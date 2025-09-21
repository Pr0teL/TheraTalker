import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/main/Header";
import { SessionClientProvider } from "@/components/session-provider";
import { TokensProvider } from "@/components/token-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "TheraTalker",
//   description: "Твой профессиональный личный психолог",
// };

export const metadata: Metadata = {
  title: "TheraTalker",
  description: "Твой профессиональный личный психолог",
  keywords: [
    "психолог",
    "поддержка",
    "анонимное обращение",
    "психолог онлайн",
    "сообщение психологу",
    "theratalker",
    "тераталкер",
    "психологическая помощь",
    "консультация психолога",
  ],
  openGraph: {
    title: "TheraTalker",
    description: "Твой профессиональный личный психолог",
  },
  metadataBase: new URL("https://theratalker.ru"),
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "any" },
    { rel: "icon", url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "shortcut icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
  ],
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "TheraTalker",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Получаем сессию на сервере
  const session = await getServerSession(authOptions);
  const initialTokens = session?.user?.tokens ?? 0;

  return (
    <html lang="ru">
      <body className={inter.className}>
        <SessionClientProvider>
          <TokensProvider initialTokens={initialTokens}>
            <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white transition-colors">
              <Header/>
              {children}
            </div>
          </TokensProvider>
        </SessionClientProvider>
      </body>
    </html>
  );
}
