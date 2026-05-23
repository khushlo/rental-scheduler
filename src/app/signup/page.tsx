import { SignupForm } from "@/components/auth/signup-form";
import { RentalSchedulerLogo } from "@/components/auth/rental-scheduler-logo";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2140 100%)" }}
      >
        <RentalSchedulerLogo size={80} color="white" />
        <h1 className="text-3xl font-bold text-white mt-6 text-center">
          Rental Scheduler
        </h1>
        <p className="text-blue-200 text-center mt-3 max-w-xs text-sm leading-relaxed">
          Manage your rental inventory, bookings, and customers — all in one place.
        </p>

        <div className="mt-10 space-y-4 w-full max-w-xs">
          {[
            { icon: "📦", text: "Manage rental products & inventory" },
            { icon: "📅", text: "Smart booking conflict detection" },
            { icon: "👥", text: "Customer management & history" },
            { icon: "📄", text: "Professional PDF invoices" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-blue-100 text-sm">
              <span className="text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <RentalSchedulerLogo size={52} color="#1e3a5f" />
          </div>
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "#1e3a5f" }}>
              Rental Scheduler
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
              <p className="text-gray-500 text-sm mt-1">
                Start managing your rentals for free
              </p>
            </div>
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
