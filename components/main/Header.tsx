
//Next auth
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/utils/auth";
import { LogoutButton } from "../auth/LogoutButton";
import { SignInButton } from "../auth/SignInButton";

export default async function Header() {
  
const session = await getServerSession(authOptions);
  return (
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
  );
};