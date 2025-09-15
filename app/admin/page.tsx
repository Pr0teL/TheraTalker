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
    <AdminPage/>
    </div>
  );
}