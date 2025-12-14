"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = ["/login"];
const ADMIN_PATHS = ["/admin"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname);
      const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));

      // Skip auth guard for admin routes - they have their own auth handling
      if (isAdminPath) {
        return;
      }

      if (!user && !isPublicPath) {
        // User is not authenticated and trying to access protected route
        router.push("/login");
      } else if (user && pathname === "/login") {
        // User is authenticated but on login page, redirect to dashboard
        router.push("/");
      }
    }
  }, [user, isLoading, pathname, router, isClient]);

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page for public paths or admin paths
  if (
    !user &&
    (PUBLIC_PATHS.includes(pathname) ||
      ADMIN_PATHS.some((path) => pathname.startsWith(path)))
  ) {
    return <>{children}</>;
  }

  // Don't render protected content if user is not authenticated (except admin paths)
  if (!user && !ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return <>{children}</>;
}
