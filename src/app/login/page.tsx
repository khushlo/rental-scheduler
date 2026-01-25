import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Rental Scheduler
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        <LoginForm />
        <div className="text-center mt-4">
          <Link
            href="/admin/login"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
