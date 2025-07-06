import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/utils/auth";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminPage from "../views/admin";

export default async function Admin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    redirect("/");
  }


  return (
    <div className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white transition-colors">
      <header className="w-full flex items-center justify-between px-6 py-3 bg-white/70 shadow-sm border-b border-gray-100 backdrop-blur-sm dark:bg-black/70 dark:border-zinc-800 dark:text-white transition-colors">
        <span className="text-xl font-semibold tracking-tight text-black dark:text-white">
          Admin Panel
        </span>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button>Вернуться</Button>
          </Link>
        </div>
      </header>
    <AdminPage/>
    </div>
  );
}