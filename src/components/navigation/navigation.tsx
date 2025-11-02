"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Package,
  Users,
  Home,
  FileText,
  Menu,
  X,
  Settings,
  Database,
  ChevronDown,
  Activity,
  NotepadText,
  ListTodo,
  Store,
  ClockAlert,
  Sliders,
} from "lucide-react";
import { SimpleToggle } from "@/components/ui/theme-toggle-shadcn";
import { ProfileDrawer } from "@/components/profile/profile-drawer";

interface NavigationSubItem {
  name: string;
  href: string;
  icon: any;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  subItems?: NavigationSubItem[];
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Masters",
    icon: Database,
    subItems: [
      {
        name: "Products",
        href: "/products",
        icon: Package,
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
      },
    ],
  },
  {
    name: "Transactions",
    icon: ListTodo,
    subItems: [
      {
        name: "Bookings",
        href: "/bookings",
        icon: NotepadText,
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: Calendar,
      },
    ],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    icon: Settings,
    subItems: [
      // {
      //   name: 'User Settings',
      //   href: '/settings/user',
      //   icon: Users,
      // },
      {
        name: "Store Settings",
        href: "/settings/store",
        icon: Store,
      },
      {
        name: "Configuration",
        href: "/settings/configuration",
        icon: Sliders,
      },
    ],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (itemName: string) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  const isSubItemActive = (subItems: NavigationSubItem[]) => {
    return subItems.some((subItem) => pathname === subItem.href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 dark:text-gray-300"
              >
                Rental Scheduler
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;

                if (item.subItems) {
                  const isActive = isSubItemActive(item.subItems);
                  const isOpen = openDropdown === item.name;

                  return (
                    <div key={item.name} className="relative">
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        onMouseEnter={() => setOpenDropdown(item.name)}
                        className={cn(
                          "inline-flex items-center px-1 pt-1 h-16 border-b-2 text-sm font-medium transition-colors",
                          isActive
                            ? "border-blue-500 text-gray-900 dark:text-gray-100"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 ml-1 transition-transform",
                            isOpen ? "rotate-180" : ""
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div
                          className="absolute top-full left-0 mt-0 min-w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className={cn(
                                  "flex items-center px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                                  isSubActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    : "text-gray-700 dark:text-gray-300"
                                )}
                              >
                                <SubIcon className="h-4 w-4 mr-3" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href!}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 h-16 border-b-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-blue-500 text-gray-900 dark:text-gray-100"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Theme Toggle and Profile */}
          <div className="hidden sm:flex items-center space-x-2">
            <SimpleToggle />
            <ProfileDrawer />
          </div>

          {/* Mobile menu button and profile */}
          <div className="sm:hidden flex items-center space-x-2">
            <SimpleToggle />
            <ProfileDrawer />
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <div
        className={cn(
          "sm:hidden transition-all duration-200 ease-in-out overflow-hidden",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pt-2 pb-3 space-y-1 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          {navigation.map((item) => {
            const Icon = item.icon;

            if (item.subItems) {
              const isActive = isSubItemActive(item.subItems);
              const isOpen = openDropdown === item.name;

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-300"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="bg-gray-100 dark:bg-gray-900/50">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={closeMobileMenu}
                            className={cn(
                              "block pl-8 pr-4 py-3 border-l-4 text-base font-medium transition-colors",
                              isSubActive
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                                : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-300"
                            )}
                          >
                            <div className="flex items-center">
                              <SubIcon className="h-5 w-5 mr-3" />
                              {subItem.name}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={closeMobileMenu}
                className={cn(
                  "block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-300"
                )}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
