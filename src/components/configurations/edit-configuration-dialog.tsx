"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { apiPut } from "@/lib/api-client";

interface Configuration {
  id: number;
  configName: string;
  description: string | null;
  rowStatusCd: string;
  createdAt: string;
  updatedAt: string;
  modifiedBy: string;
  value: string | null;
  hasValue: boolean;
}

interface EditConfigurationDialogProps {
  configuration: Configuration;
  isOpen: boolean;
  onClose: () => void;
}

export function EditConfigurationDialog({
  configuration,
  isOpen,
  onClose,
}: EditConfigurationDialogProps) {
  const [value, setValue] = useState<string>(configuration.value || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders after client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update value when configuration changes
  useEffect(() => {
    setValue(configuration.value || "");
    setError("");
  }, [configuration.id, configuration.value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");

    try {
      const method = configuration.hasValue ? "PUT" : "POST";
      const body = configuration.hasValue
        ? {
            configId: configuration.id,
            value: value,
            modifiedBy: "User",
          }
        : {
            configId: configuration.id,
            value: value,
            modifiedBy: "User",
          };

      const response = await apiPut("/api/configurations", body);

      if (response.ok) {
        onClose();
      } else {
        const errorData = await response.json();
        setError(
          errorData.error ||
            `Failed to ${
              configuration.hasValue ? "update" : "configure"
            } setting`
        );
      }
    } catch (error) {
      console.error(
        `Error ${configuration.hasValue ? "updating" : "configuring"} setting:`,
        error
      );
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setValue(configuration.value || "");
    setError("");
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {configuration.hasValue ? "Edit" : "Configure"} Setting
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {configuration.hasValue
                ? `Update the value for`
                : `Set a value for`}{" "}
              <strong>{configuration.configName}</strong>
            </p>
            {configuration.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {configuration.description}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="configValue">Configuration Value</Label>
            <textarea
              id="configValue"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter configuration value..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-vertical"
              rows={4}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? configuration.hasValue
                  ? "Updating..."
                  : "Setting..."
                : configuration.hasValue
                ? "Update Setting"
                : "Set Value"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
