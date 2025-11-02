import ConfigurationDataGrid from "@/components/configurations/configuration-data-grid";

export default function ConfigurationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="max-w-full mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Configuration Management
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage system configurations for your tenant. Each configuration
              can have a unique value for your organization.
            </p>
          </div>
          <ConfigurationDataGrid />
        </div>
      </div>
    </div>
  );
}
