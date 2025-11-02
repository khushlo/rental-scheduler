"use client";

import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/ui/data-grid";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { EditConfigurationDialog } from "./edit-configuration-dialog";
import { AddConfigurationDialog } from "./add-configuration-dialog";

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

export default function ConfigurationDataGrid() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(
    null
  );
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/configurations");
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      } else {
        console.error("Failed to fetch configurations");
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config);
  };

  const handleEditClose = () => {
    setEditingConfig(null);
    fetchConfigurations(); // Refresh data
  };

  const handleAddClose = () => {
    setShowAddDialog(false);
    fetchConfigurations(); // Refresh data
  };

  const columns: Column<Configuration>[] = [
    {
      key: "configName",
      header: "Configuration Name",
      width: "25%",
      render: (config) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {config.configName}
        </div>
      ),
      mobileRender: (config) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {config.configName}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      width: "30%",
      render: (config) => (
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {config.description || "No description"}
        </div>
      ),
    },
    {
      key: "value",
      header: "Current Value",
      width: "25%",
      render: (config) => (
        <div className="text-sm">
          {config.hasValue ? (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md font-mono">
              {config.value || "Empty"}
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
              Not set
            </span>
          )}
        </div>
      ),
    },
    {
      key: "modifiedBy",
      header: "Modified By",
      width: "15%",
      render: (config) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {config.modifiedBy}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "5%",
      render: (config) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(config)}
          className="p-2"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                System Configurations
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage configuration values for your organization
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Configuration
            </Button>
          </div>

          <DataGrid
            data={configurations}
            columns={columns}
            loading={loading}
            emptyMessage="No configurations found. Add a configuration to get started."
          />
        </div>
      </div>

      {editingConfig && (
        <EditConfigurationDialog
          configuration={editingConfig}
          isOpen={!!editingConfig}
          onClose={handleEditClose}
        />
      )}

      <AddConfigurationDialog isOpen={showAddDialog} onClose={handleAddClose} />
    </>
  );
}
