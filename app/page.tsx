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
      {(session?.user?.role != 'specialist' && session?.user?.role != 'admin') && <footer className="w-full border-t border-border bg-white">
  <div className="max-w-6xl mx-auto px-3 py-3 flex flex-col items-center text-center gap-2 md:flex-row md:items-center md:justify-between md:text-left md:gap-0 text-xs text-muted-foreground">
    
    {/* Левая часть */}
    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4">
      <p>© {new Date().getFullYear()} TheraTalker</p>
      <p>*Информация о компании*</p>
    </div>

    {/* Правая часть */}
    <div className="flex flex-wrap justify-center gap-3 md:flex-nowrap md:gap-6">
      <Link href="#" className="hover:text-primary transition-colors">
        Политика конфиденциальности
      </Link>
      <Link href="#" className="hover:text-primary transition-colors">
        Оферта
      </Link>
      <Link href="#" className="hover:text-primary transition-colors">
        Цены и оплата
      </Link>
    </div>
  </div>
</footer>
}
    </>
  );
}