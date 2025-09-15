import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/main/Header";
import { SessionClientProvider } from "@/components/session-provider";
import { TokensProvider } from "@/components/token-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TheraTalker",
  description: "Твой профессиональный личный психолог",
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
