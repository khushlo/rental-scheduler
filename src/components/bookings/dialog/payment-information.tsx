'use client';

interface PaymentInformationProps {
  totalAmount: number;
  advancePayment: number;
  calculatedTotal: number;
  onTotalAmountChange: (amount: number) => void;
  onAdvancePaymentChange: (amount: number) => void;
  isSubmitting: boolean;
}

export function PaymentInformation({
  totalAmount,
  advancePayment,
  calculatedTotal,
  onTotalAmountChange,
  onAdvancePaymentChange,
  isSubmitting
}: PaymentInformationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Payment Information</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={totalAmount || calculatedTotal || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onTotalAmountChange(0);
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  onTotalAmountChange(numValue);
                }
              }
            }}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Advance Payment
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={advancePayment || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onAdvancePaymentChange(0);
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  onAdvancePaymentChange(numValue);
                }
              }
            }}
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}