import Link from 'next/link'
import { Calendar, Package, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" style={{color: 'inherit'}}>
            Rental Management Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your rental business efficiently. Schedule bookings, track inventory, and avoid conflicts.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Bookings</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">$0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/products"
            className="group relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Package className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Manage Products
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                View and manage your rental inventory with a powerful data grid.
              </p>
              <div className="mt-3">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  Go to Products →
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/customers"
            className="group relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <Users className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
                Manage Customers
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Keep track of your customer database and contact information.
              </p>
              <div className="mt-3">
                <span className="text-sm font-medium text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300">
                  Go to Customers →
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/bookings"
            className="group relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Calendar className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Manage Bookings
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Schedule and track all rental bookings with date filtering.
              </p>
              <div className="mt-3">
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  Go to Bookings →
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/calendar"
            className="group relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                <Calendar className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Calendar View
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Visual calendar to see all bookings and availability at a glance.
              </p>
              <div className="mt-3">
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300">
                  Go to Calendar →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Overview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Advanced Data Grids</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Powerful tables with pagination (50 items per page), search, and filtering capabilities.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Visual Calendar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Interactive calendar view to see all bookings and availability at a glance.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Conflict Prevention</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Smart scheduling system to prevent double-bookings and manage availability.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}