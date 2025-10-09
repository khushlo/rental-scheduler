'use client';

interface RentalPeriodProps {
  formData: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    eventDate: string;
  };
  onDateChange: (field: 'startDate' | 'endDate', value: string) => void;
  onTimeChange: (field: 'startTime' | 'endTime', value: string) => void;
  onEventDateChange: (value: string) => void;
  isSubmitting: boolean;
}

export function RentalPeriod({
  formData,
  onDateChange,
  onTimeChange,
  onEventDateChange,
  isSubmitting
}: RentalPeriodProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Rental Period</h3>
      </div>
      
      {/* Dates Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => onDateChange('startDate', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => onDateChange('endDate', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          />
        </div>
      </div>
      
      {/* Times Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => onTimeChange('startTime', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => onTimeChange('endTime', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          />
        </div>
      </div>
      
      {/* Event Date Row */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Event Date <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <input
          type="date"
          value={formData.eventDate}
          onChange={(e) => onEventDateChange(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          placeholder="Select event date if applicable"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Specify when the actual event/function will take place (if different from rental period)
        </p>
      </div>
    </div>
  );
}