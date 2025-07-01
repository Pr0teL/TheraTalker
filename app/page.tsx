//Next auth
import { getServerSession } from "next-auth";

//Options
import { authOptions } from "@/lib/utils/auth";

//Components
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SignInButton } from "@/components/auth/SignInButton";
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link";
import { Main } from "./views/main";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white transition-colors">
      <header className="w-full flex items-center justify-between px-6 py-3 bg-white/70 shadow-sm border-b border-gray-100 backdrop-blur-sm dark:bg-black/70 dark:border-zinc-800 dark:text-white transition-colors">
        <span className="text-xl font-semibold tracking-tight text-black dark:text-white">
          Startloom
        </span>
        <div className="flex items-center gap-3">
          {session && session.user?.email && (
            <span className="text-sm text-gray-700 flex flex-col dark:text-gray-200">
              <span
                className="max-w-[100px] md:max-w-none truncate"
                title={session.user.email}
              >
                {session.user.email}
              </span>
            </span>
          )}
          {session ? <LogoutButton /> : <SignInButton />}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 transition-colors">
        <Toaster />
        <div className="w-full">
          <Main />
        </div>
      </main>
      <footer>
        <div className="w-full pl-8 pr-8 pt-4 pb-4 border-t border-border flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <p>© {new Date().getFullYear()} Startloom</p>
            <p className="mt-2 md:mt-0">
              *Информация о компании*
            </p>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0 whitespace-nowrap">
            <Link href="#" className="hover:text-primary transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Договор оферты
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}