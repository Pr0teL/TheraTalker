"use client";

//Actions
import { logOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button"

export const LogoutButton = () => {
  const handleLogOut = async () =>
    logOut({ callbackUrl: `${window.location.origin}` });

  return (
    <Button
      onClick={handleLogOut}
    >
      Выйти
    </Button>
  );
};