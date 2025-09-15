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
import Header from "@/components/main/Header";
import { Specialist } from "./views/specialist";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-4 transition-colors">
        <Toaster />
        <div className="w-full flex flex-col items-center justify-center">
          {session && session.user?.role != 'user' ? <Specialist/> :<Main />}
        </div>
      </main>
      {(session?.user?.role != 'specialist' && session?.user?.role != 'admin') && <footer>
        <div className="w-full pl-8 pr-8 pt-4 pb-4 border-t border-border flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <p>© {new Date().getFullYear()} TheraTalker</p>
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
      </footer>}
    </>
  );
}