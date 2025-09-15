
//Next auth
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/utils/auth";
import { LogoutButton } from "../auth/LogoutButton";
import { SignInButton } from "../auth/SignInButton";
import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";
import TokenViewer from "./TokenViewer";

export default async function Header() {

  const session = await getServerSession(authOptions);
  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-white/70 shadow-sm border-b border-gray-100 backdrop-blur-sm dark:bg-black/70 dark:border-zinc-800 dark:text-white transition-colors">
      <Link href="/">
        <span className="text-xl font-semibold tracking-tight text-black dark:text-white">
          <img
            src="/TheraTalkerFullLogo.png"
            alt="TheraTalker Logo"
            className="h-12 w-auto"
          />
        </span>
      </Link>
      <div className="flex items-center gap-3">
        {session && session.user?.email && (
          <div className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
            <span
              className="max-w-[100px] md:max-w-none truncate"
              title={session.user.email}
            >
              {session.user.email}
            </span>
            {session.user.role === 'specialist' ? (
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200 w-fit">
                <ShieldCheck className="h-3.5 w-3.5" />
                Специалист
              </span>
            ) : ( 
              <Link href="/purchase">
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
                <TokenViewer/> <Zap className="h-3.5 w-3.5"/>
              </span>
              </Link>)}
          </div>
        )}
        {session ? <LogoutButton /> : <SignInButton />}
      </div>
    </header>
  );
};