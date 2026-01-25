"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Plus,
  Users,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  Edit,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useApiClient } from "@/hooks/useApi";
import { apiPost, apiPut } from "@/lib/api-client";

// Helper function to format date consistently for SSR
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

interface User {
  id: number;
  username: string;
  tenantId: number;
  rowStatusCd: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  tenant: {
    id: number;
    name: string;
    subdomain: string;
  };
}

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
}

interface ConfigMaster {
  id: number;
  configName: string;
  description: string;
  dataType: string;
  defaultValue: string;
  rowStatusCd: string;
  createdAt: string;
  updatedAt: string;
  modifiedBy: string;
}

function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [configs, setConfigs] = useState<ConfigMaster[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "tenants" | "configs">(
    "users",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateConfigForm, setShowCreateConfigForm] = useState(false);
  const [showEditConfigForm, setShowEditConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigMaster | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    tenantId: "",
  });
  const [configFormData, setConfigFormData] = useState({
    configName: "",
    description: "",
  });
  const router = useRouter();
  const apiClient = useApiClient();

  // Utility function to get admin token
  const getAdminToken = () => {
    return localStorage.getItem("admin-auth-token");
  };

  // Utility function to get auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const checkAdminAuth = useCallback(async () => {
    if (!mounted) return;

    try {
      console.log("Checking admin auth...");
      const token = getAdminToken();
      console.log("Token available:", !!token);

      if (!token) {
        console.log("No token found, setting authenticated to false");
        setIsAuthenticated(false);
        router.push("/admin/login");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await apiClient.get("/api/admin/auth/verify", {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          ...getAuthHeaders(),
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        if (data.user && data.user.role === "admin") {
          console.log("Admin authenticated successfully");
          setIsAuthenticated(true);
        } else {
          console.log("User is not admin, data:", data);
          setIsAuthenticated(false);
          router.push("/admin/login");
        }
      } else {
        console.log("Auth verification failed:", response.status);
        setIsAuthenticated(false);
        router.push("/admin/login");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Admin auth check timed out");
      } else {
        console.error("Admin auth check error:", error);
      }
      setIsAuthenticated(false);
      router.push("/admin/login");
    } finally {
      setIsLoading(false);
    }
  }, [mounted, router]);

  const fetchUsers = useCallback(async () => {
    if (isAuthenticated !== true || isLoadingUsers) return;

    setIsLoadingUsers(true);
    try {
      console.log("Fetching users...");
      const response = await apiClient.get("/api/admin/users", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Users data:", data);
        setUsers(data.users || []);
      } else {
        console.log("Failed to fetch users:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated]);

  const fetchTenants = useCallback(async () => {
    console.log(
      "fetchTenants called, isAuthenticated:",
      isAuthenticated,
      "isLoadingTenants:",
      isLoadingTenants,
    );
    if (isAuthenticated !== true || isLoadingTenants) return;

    setIsLoadingTenants(true);
    try {
      console.log("Fetching tenants...");
      const response = await apiClient.get("/api/admin/tenants", {
        headers: getAuthHeaders(),
      });
      console.log("Tenants API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Tenants data:", data);
        setTenants(data || []);
      } else {
        console.log("Failed to fetch tenants:", response.status);
        const errorData = await response.text();
        console.log("Error response:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setIsLoadingTenants(false);
    }
  }, [isAuthenticated]);

  const fetchConfigs = useCallback(async () => {
    if (isAuthenticated !== true || isLoadingConfigs) return;

    setIsLoadingConfigs(true);
    try {
      console.log("Fetching configs...");
      const response = await apiClient.get("/api/admin/configs", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Configs data:", data);
        setConfigs(data || []);
      } else {
        console.log("Failed to fetch configs:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    } finally {
      setIsLoadingConfigs(false);
    }
  }, [isAuthenticated]);

  // Ensure component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check auth when mounted
  useEffect(() => {
    if (mounted) {
      checkAdminAuth();
    }
  }, [mounted, checkAdminAuth]);

  // Also check auth when component first loads and has a token
  useEffect(() => {
    if (mounted && isAuthenticated === null) {
      const token = getAdminToken();
      console.log("Initial token check - Token found:", !!token);
      if (token) {
        console.log("Token found in localStorage, checking auth...");
        checkAdminAuth();
      } else {
        console.log("No token found, redirecting to login...");
        setIsAuthenticated(false);
        router.push("/admin/login");
      }
    }
  }, [mounted, isAuthenticated, checkAdminAuth]);

  // Fetch data when authenticated
  useEffect(() => {
    console.log(
      "Data fetch useEffect triggered, isAuthenticated:",
      isAuthenticated,
    );
    if (isAuthenticated === true) {
      console.log("Starting to fetch data...");
      // Fetch data immediately when authenticated
      fetchUsers();
      fetchTenants();
      fetchConfigs();
    }
  }, [isAuthenticated, fetchUsers, fetchTenants, fetchConfigs]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!formData.username || !formData.password || !formData.tenantId) {
      setMessage("All fields are required");
      return;
    }

    try {
      const response = await apiPost("/api/admin/users", {
        username: formData.username,
        password: formData.password,
        tenantId: parseInt(formData.tenantId),
        updatedBy: "Admin",
      });

      if (response.ok) {
        setMessage("User created successfully!");
        setFormData({ username: "", password: "", tenantId: "" });
        setShowCreateForm(false);
        fetchUsers(); // Refresh users list
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to create user");
      }
    } catch (error: any) {}
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!configFormData.configName || !configFormData.description) {
      setMessage("Config name and description are required");
      return;
    }

    try {
      const response = await apiPost("/api/admin/configs", {
        configName: configFormData.configName,
        description: configFormData.description,
        modifiedBy: "Admin",
      });

      if (response.ok) {
        setMessage("Configuration created successfully!");
        setConfigFormData({
          configName: "",
          description: "",
        });
        setShowCreateConfigForm(false);
        fetchConfigs(); // Refresh configs list
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to create configuration");
      }
    } catch (error: any) {
      setMessage("Failed to create configuration");
    }
  };

  const handleEditConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (
      !editingConfig ||
      !configFormData.configName ||
      !configFormData.description
    ) {
      setMessage("Config name and description are required");
      return;
    }

    try {
      const response = await apiPut(`/api/admin/configs/${editingConfig.id}`, {
        configName: configFormData.configName,
        description: configFormData.description,
        modifiedBy: "Admin",
      });

      if (response.ok) {
        setMessage("Configuration updated successfully!");
        setConfigFormData({
          configName: "",
          description: "",
        });
        setShowEditConfigForm(false);
        setEditingConfig(null);
        fetchConfigs(); // Refresh configs list
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to update configuration");
      }
    } catch (error: any) {
      setMessage("Failed to update configuration");
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`/api/admin/configs/${configId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        setMessage("Configuration deleted successfully!");
        fetchConfigs(); // Refresh configs list
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to delete configuration");
      }
    } catch (error: any) {
      setMessage("Failed to delete configuration");
    }
  };

  const openEditConfigForm = (config: ConfigMaster) => {
    setEditingConfig(config);
    setConfigFormData({
      configName: config.configName,
      description: config.description || "",
    });
    setShowEditConfigForm(true);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/admin/auth/logout", undefined, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem("admin-auth-token");
      router.push("/admin/login");
    }
  };

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.includes("successfully")
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Tenants
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tenants.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Quick Actions
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="mt-2 flex items-center gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create User
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username</Label>
                    <Input
                      id="new-username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Enter password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-select">Tenant</Label>
                    <select
                      id="tenant-select"
                      value={formData.tenantId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tenantId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select Tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.subdomain})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ username: "", password: "", tenantId: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found. Create the first user to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Username
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Tenant
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Created
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Updated By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {user.tenant.name} ({user.tenant.subdomain})
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.rowStatusCd === "A"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {user.rowStatusCd === "A" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {user.updatedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Config Form */}
        {showCreateConfigForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateConfig} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="config-name">Configuration Name</Label>
                  <Input
                    id="config-name"
                    value={configFormData.configName}
                    onChange={(e) =>
                      setConfigFormData((prev) => ({
                        ...prev,
                        configName: e.target.value,
                      }))
                    }
                    placeholder="Enter configuration name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="config-description">Description</Label>
                  <Input
                    id="config-description"
                    value={configFormData.description}
                    onChange={(e) =>
                      setConfigFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter configuration description"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Configuration
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateConfigForm(false);
                      setConfigFormData({
                        configName: "",
                        description: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Config Form */}
        {showEditConfigForm && editingConfig && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditConfig} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-config-name">Configuration Name</Label>
                  <Input
                    id="edit-config-name"
                    value={configFormData.configName}
                    onChange={(e) =>
                      setConfigFormData((prev) => ({
                        ...prev,
                        configName: e.target.value,
                      }))
                    }
                    placeholder="Enter configuration name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-config-description">Description</Label>
                  <Input
                    id="edit-config-description"
                    value={configFormData.description}
                    onChange={(e) =>
                      setConfigFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter configuration description"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    <Edit className="h-4 w-4 mr-2" />
                    Update Configuration
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditConfigForm(false);
                      setEditingConfig(null);
                      setConfigFormData({
                        configName: "",
                        description: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Configuration Management Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Management
              </CardTitle>
              <Button
                onClick={() => setShowCreateConfigForm(!showCreateConfigForm)}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Configuration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingConfigs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading configurations...</p>
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No configurations found. Create the first configuration to get
                started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Description
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Modified By
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config) => (
                      <tr
                        key={config.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {config.configName}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {config.description}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              config.rowStatusCd === "A"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {config.rowStatusCd === "A" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {config.modifiedBy}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditConfigForm(config)}
                              className="p-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteConfig(config.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Disable SSR to prevent hydration issues
const AdminDashboardWithNoSSR = dynamic(() => Promise.resolve(AdminDashboard), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  ),
});

export default AdminDashboardWithNoSSR;
