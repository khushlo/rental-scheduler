"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(() => import("./dashboard-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <DashboardContent />;
}
