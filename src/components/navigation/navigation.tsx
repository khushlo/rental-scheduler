'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Calendar, Package, Users, Home, Search } from 'lucide-react';
import { SimpleToggle } from '@/components/ui/theme-toggle-shadcn';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: Calendar,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'ID Lookup',
    href: '/lookup',
    icon: Search,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-300">
                Rental Scheduler
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            <SimpleToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-300'
                )}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="pt-2 pb-3 px-3">
          <SimpleToggle />
        </div>
      </div>
    </nav>
  );
}