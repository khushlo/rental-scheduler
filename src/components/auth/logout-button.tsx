"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Logout successful - redirect to login
        router.push("/login");
        router.refresh(); // Refresh to update auth state
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      {children}
    </Button>
  );
}
