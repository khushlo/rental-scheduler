"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface MasterConfiguration {
  id: number;
  configName: string;
  description: string | null;
}

interface AddConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigurationAdded: () => void;
}

export function AddConfigurationDialog({
  isOpen,
  onClose,
  onConfigurationAdded,
}: AddConfigurationDialogProps) {
  const [availableConfigurations, setAvailableConfigurations] = useState<MasterConfiguration[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [value, setValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch available configurations that don't have tenant values yet
  useEffect(() => {
    if (isOpen) {
      fetchAvailableConfigurations();
    }
  }, [isOpen]);

  const fetchAvailableConfigurations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/configurations/available");
      if (response.ok) {
        const data = await response.json();
        setAvailableConfigurations(data);
      } else {
        setError("Failed to fetch available configurations");
      }
    } catch (error) {
      console.error("Error fetching available configurations:", error);
      setError("Failed to fetch available configurations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConfigId) {
      setError("Please select a configuration");
      return;
    }

    if (!value.trim()) {
      setError("Configuration value is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          configId: selectedConfigId,
          value: value.trim(),
          modifiedBy: "User",
        }),
      });

      if (response.ok) {
        onConfigurationAdded();
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add configuration");
      }
    } catch (error) {
      console.error("Error adding configuration:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedConfigId(null);
    setValue("");
    setError("");
    setAvailableConfigurations([]);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Configure Setting
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Set a value for an existing configuration
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading configurations...</span>
            </div>
          ) : availableConfigurations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                All available configurations have been set for your tenant.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="configSelect">Select Configuration *</Label>
                <select
                  id="configSelect"
                  value={selectedConfigId || ""}
                  onChange={(e) => setSelectedConfigId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                >
                  <option value="">Choose a configuration...</option>
                  {availableConfigurations.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.configName}
                    </option>
                  ))}
                </select>
                {selectedConfigId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {availableConfigurations.find(c => c.id === selectedConfigId)?.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="configValue">Configuration Value *</Label>
                <textarea
                  id="configValue"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter configuration value..."
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-vertical"
                  rows={4}
                  required
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading || availableConfigurations.length === 0}
            >
              {isSubmitting ? "Configuring..." : "Set Configuration"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
