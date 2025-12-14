"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation/navigation";
import { useState, useEffect } from "react";

const PUBLIC_PATHS = ["/login"];

export function ConditionalNavigation() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  // Don't show navigation if:
  // 1. Still loading auth state
  // 2. User is not authenticated
  // 3. Current path is a public path (like login)
  // 4. Current path is admin routes
  if (
    isLoading ||
    !user ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return <Navigation />;
}
