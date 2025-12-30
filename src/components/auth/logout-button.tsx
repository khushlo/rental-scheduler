"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

interface LogoutButtonProps {
  children?: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LogoutButton({
  children = "Logout",
  variant = "ghost",
  size = "default",
}: LogoutButtonProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      {children}
    </Button>
  );
}
