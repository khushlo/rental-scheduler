"use client";

import { useState } from "react";
import {
  Calendar,
  Package,
  Users,
  BarChart2,
  Settings,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

const TOUR_STEPS = [
  {
    icon: <BookOpen className="w-8 h-8 text-blue-500" />,
    title: "Welcome to Rental Scheduler",
    description:
      "This quick tour will walk you through all the key features of your rental management system. You can relaunch the tour anytime from the dashboard.",
    tip: "Use the sidebar navigation on the left to quickly switch between pages.",
    color: "blue",
  },
  {
    icon: <Calendar className="w-8 h-8 text-green-500" />,
    title: "Bookings",
    description:
      "Create and manage all your rental bookings from the Bookings page. You can add new bookings, edit dates, assign customers and products, update status, and generate invoices.",
    tip: "Use the 'New Booking' button and fill in the customer, product, dates, and quantity. The system checks for conflicts automatically.",
    color: "green",
  },
  {
    icon: <Calendar className="w-8 h-8 text-purple-500" />,
    title: "Calendar View",
    description:
      "The Calendar page gives you a visual overview of all bookings across a month. Quickly spot overlaps, busy periods, and free slots at a glance.",
    tip: "Click any booking on the calendar to view its details.",
    color: "purple",
  },
  {
    icon: <Users className="w-8 h-8 text-orange-500" />,
    title: "Customers",
    description:
      "The Customers page lists all your clients. Add new customers, edit their contact details, and save contacts directly to your mobile phone as a vCard.",
    tip: "The 'Save Contact' button on each row lets you download a customer's details as a phone contact instantly.",
    color: "orange",
  },
  {
    icon: <Package className="w-8 h-8 text-red-500" />,
    title: "Products",
    description:
      "Manage your rental inventory from the Products page. Add items for hire, set daily rates, define delay hours between bookings, and control availability.",
    tip: "Set 'Delay Hours' on a product to automatically block a buffer period after each booking for cleaning or transport.",
    color: "red",
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-teal-500" />,
    title: "Reports",
    description:
      "The Reports section gives you a financial summary of your business. View revenue by date range, see a balance sheet, and track outstanding payments.",
    tip: "Use the date filter to narrow down revenue reports to a specific week, month, or custom range.",
    color: "teal",
  },
  {
    icon: <Settings className="w-8 h-8 text-gray-500" />,
    title: "Settings",
    description:
      "In Settings you can configure your store details, booking notes templates, and other system-wide preferences to personalise your experience.",
    tip: "Set up default booking notes in Settings > Configuration so they pre-fill every new booking automatically.",
    color: "gray",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200",
  orange: "bg-orange-50 border-orange-200",
  red: "bg-red-50 border-red-200",
  teal: "bg-teal-50 border-teal-200",
  gray: "bg-gray-50 border-gray-200",
};

const dotColor: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  teal: "bg-teal-500",
  gray: "bg-gray-400",
};

export function TourGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const current = TOUR_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === TOUR_STEPS.length - 1;

  const openTour = () => {
    setStep(0);
    setOpen(true);
  };

  const close = () => setOpen(false);
  const next = () => setStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <>
      {/* Tour trigger button */}
      <button
        onClick={openTour}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm transition-colors"
        style={{ backgroundColor: "#1e3a5f" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "#152d4a")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "#1e3a5f")
        }
      >
        <Lightbulb size={15} />
        Take a Tour
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-[#1e3a5f] transition-all duration-300"
                style={{
                  width: `${((step + 1) / TOUR_STEPS.length) * 100}%`,
                }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Step {step + 1} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-2">
              <div
                className={`flex flex-col items-center text-center p-6 rounded-xl border ${colorMap[current.color]} mb-4`}
              >
                <div className="mb-3">{current.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {current.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Tip */}
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Tip: </span>
                  {current.tip}
                </p>
              </div>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 pb-3">
              {TOUR_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`rounded-full transition-all ${
                    i === step
                      ? `w-4 h-2 ${dotColor[s.color]}`
                      : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-6 pb-5 pt-1">
              <button
                onClick={prev}
                disabled={isFirst}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {isLast ? (
                <button
                  onClick={close}
                  className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#152d4a")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#1e3a5f")
                  }
                >
                  Done 🎉
                </button>
              ) : (
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#152d4a")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#1e3a5f")
                  }
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
