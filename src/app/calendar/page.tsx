'use client';

import { useState } from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { OrdersList } from '@/components/orders/orders-list';
import { Calendar, List } from 'lucide-react';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="container mx-auto px-4 py-6">
      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="h-4 w-4" />
            List View
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? <CalendarView /> : <OrdersList />}
    </div>
  );
}