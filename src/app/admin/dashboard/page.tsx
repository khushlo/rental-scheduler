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
  Building2,
  Search,
  X,
  BadgeCheck,
  Ban,
  CheckCircle2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useApiClient } from "@/hooks/useApi";
import { apiPost, apiPut } from "@/lib/api-client";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}/${d}/${y}`;
};

interface User {
  id: number;
  username: string;
  tenantId: number;
  rowStatusCd: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  tenant: { id: number; name: string; subdomain: string };
}

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  storeName?: string;
  isActive: boolean;
  isLicensed: boolean;
  signupSource?: string;
  createdAt: string;
  _count?: { userLogins: number; bookings: number; customers: number; products: number };
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
  const [activeTab, setActiveTab] = useState<"users" | "tenants" | "configs">("users");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [configSearch, setConfigSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", tenantId: "" });
  const [showCreateConfigForm, setShowCreateConfigForm] = useState(false);
  const [showEditConfigForm, setShowEditConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigMaster | null>(null);
  const [configFormData, setConfigFormData] = useState({ configName: "", description: "" });
  const [showEditTenant, setShowEditTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantFormData, setTenantFormData] = useState({ name: "", storeName: "", isLicensed: false, isActive: true });
  const [message, setMessage] = useState("");
  const router = useRouter();
  const apiClient = useApiClient();

  const getAdminToken = () => localStorage.getItem("admin-auth-token");
  const getAuthHeaders = (): Record<string, string> => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(""), 3500); };

  const checkAdminAuth = useCallback(async () => {
    if (!mounted) return;
    try {
      const token = getAdminToken();
      if (!token) { setIsAuthenticated(false); router.push("/admin/login"); return; }
      const response = await apiClient.get("/api/admin/auth/verify", {
        headers: { "Cache-Control": "no-cache", ...getAuthHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user?.role === "admin") { setIsAuthenticated(true); }
        else { setIsAuthenticated(false); router.push("/admin/login"); }
      } else { setIsAuthenticated(false); router.push("/admin/login"); }
    } catch { setIsAuthenticated(false); router.push("/admin/login"); }
    finally { setIsLoading(false); }
  }, [mounted, router]);

  const fetchUsers = useCallback(async () => {
    if (isAuthenticated !== true || isLoadingUsers) return;
    setIsLoadingUsers(true);
    try {
      const res = await apiClient.get("/api/admin/users", { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setUsers(d.users || []); }
    } catch { } finally { setIsLoadingUsers(false); }
  }, [isAuthenticated]);

  const fetchTenants = useCallback(async () => {
    if (isAuthenticated !== true || isLoadingTenants) return;
    setIsLoadingTenants(true);
    try {
      const res = await apiClient.get("/api/admin/tenants", { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setTenants(d || []); }
    } catch { } finally { setIsLoadingTenants(false); }
  }, [isAuthenticated]);

  const fetchConfigs = useCallback(async () => {
    if (isAuthenticated !== true || isLoadingConfigs) return;
    setIsLoadingConfigs(true);
    try {
      const res = await apiClient.get("/api/admin/configs", { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setConfigs(d || []); }
    } catch { } finally { setIsLoadingConfigs(false); }
  }, [isAuthenticated]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) checkAdminAuth(); }, [mounted, checkAdminAuth]);
  useEffect(() => {
    if (mounted && isAuthenticated === null) {
      const token = getAdminToken();
      if (token) checkAdminAuth(); else { setIsAuthenticated(false); router.push("/admin/login"); }
    }
  }, [mounted, isAuthenticated, checkAdminAuth]);
  useEffect(() => {
    if (isAuthenticated === true) { fetchUsers(); fetchTenants(); fetchConfigs(); }
  }, [isAuthenticated, fetchUsers, fetchTenants, fetchConfigs]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.tenantId) { showMsg("All fields are required"); return; }
    try {
      const res = await apiPost("/api/admin/users", { username: formData.username, password: formData.password, tenantId: parseInt(formData.tenantId), updatedBy: "Admin" });
      if (res.ok) { showMsg("User created successfully!"); setFormData({ username: "", password: "", tenantId: "" }); setShowCreateForm(false); fetchUsers(); }
      else { const d = await res.json(); showMsg(d.error || "Failed to create user"); }
    } catch { showMsg("Failed to create user"); }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configFormData.configName || !configFormData.description) { showMsg("All fields required"); return; }
    try {
      const res = await apiPost("/api/admin/configs", { configName: configFormData.configName, description: configFormData.description, modifiedBy: "Admin" });
      if (res.ok) { showMsg("Configuration created successfully!"); setConfigFormData({ configName: "", description: "" }); setShowCreateConfigForm(false); fetchConfigs(); }
      else { const d = await res.json(); showMsg(d.error || "Failed to create configuration"); }
    } catch { showMsg("Failed to create configuration"); }
  };

  const handleEditConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig || !configFormData.configName || !configFormData.description) { showMsg("All fields required"); return; }
    try {
      const res = await apiPut(`/api/admin/configs/${editingConfig.id}`, { configName: configFormData.configName, description: configFormData.description, modifiedBy: "Admin" });
      if (res.ok) { showMsg("Configuration updated successfully!"); setConfigFormData({ configName: "", description: "" }); setShowEditConfigForm(false); setEditingConfig(null); fetchConfigs(); }
      else { const d = await res.json(); showMsg(d.error || "Failed to update"); }
    } catch { showMsg("Failed to update configuration"); }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm("Delete this configuration?")) return;
    try {
      const res = await fetch(`/api/admin/configs/${configId}`, { method: "DELETE", headers: { "Content-Type": "application/json", ...getAuthHeaders() } });
      if (res.ok) { showMsg("Configuration deleted successfully!"); fetchConfigs(); }
      else { const d = await res.json(); showMsg(d.error || "Failed to delete"); }
    } catch { showMsg("Failed to delete configuration"); }
  };

  const openEditConfigForm = (config: ConfigMaster) => {
    setEditingConfig(config);
    setConfigFormData({ configName: config.configName, description: config.description || "" });
    setShowEditConfigForm(true);
  };

  const openEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantFormData({ name: tenant.name, storeName: tenant.storeName ?? "", isLicensed: tenant.isLicensed, isActive: tenant.isActive });
    setShowEditTenant(true);
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const res = await fetch(`/api/admin/tenants/${editingTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: tenantFormData.name, storeName: tenantFormData.storeName, isLicensed: tenantFormData.isLicensed, isActive: tenantFormData.isActive }),
      });
      if (res.ok) { showMsg("Tenant updated successfully!"); setShowEditTenant(false); setEditingTenant(null); fetchTenants(); }
      else { const d = await res.json(); showMsg(d.error || "Failed to update tenant"); }
    } catch { showMsg("Failed to update tenant"); }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`DELETE tenant "${tenant.name}"?\n\nThis will permanently delete ALL data:\n• ${tenant._count?.userLogins ?? 0} users\n• ${tenant._count?.bookings ?? 0} bookings\n• ${tenant._count?.customers ?? 0} customers\n• ${tenant._count?.products ?? 0} products\n\nThis CANNOT be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, { method: "DELETE", headers: { "Content-Type": "application/json", ...getAuthHeaders() } });
      if (res.ok) { showMsg("Tenant and all data deleted."); fetchTenants(); fetchUsers(); }
      else { const d = await res.json(); showMsg(d.error || "Failed to delete tenant"); }
    } catch { showMsg("Failed to delete tenant"); }
  };

  const handleLogout = async () => {
    try { await apiClient.post("/api/admin/auth/logout", undefined, { headers: getAuthHeaders() }); }
    catch { }
    finally { localStorage.removeItem("admin-auth-token"); router.push("/admin/login"); }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.tenant.name.toLowerCase().includes(q) || u.tenant.subdomain.toLowerCase().includes(q);
  });
  const filteredTenants = tenants.filter(t => {
    const q = tenantSearch.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q) || (t.storeName ?? "").toLowerCase().includes(q);
  });
  const filteredConfigs = configs.filter(c => {
    const q = configSearch.toLowerCase();
    return c.configName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  if (!mounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">{!mounted ? "Loading..." : "Verifying admin access..."}</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const TAB = (tab: string) =>
    `px-5 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? "bg-[#1e3a5f] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-7 w-7 text-[#1e3a5f] dark:text-blue-400 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.toLowerCase().includes("successfully") || message.toLowerCase().includes("deleted") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.toLowerCase().includes("successfully") || message.toLowerCase().includes("deleted") ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users className="h-5 w-5 text-blue-500" />, label: "Total Users", value: users.length, bg: "bg-blue-50 dark:bg-blue-900/20" },
            { icon: <Building2 className="h-5 w-5 text-green-500" />, label: "Tenants", value: tenants.length, bg: "bg-green-50 dark:bg-green-900/20" },
            { icon: <BadgeCheck className="h-5 w-5 text-purple-500" />, label: "Licensed", value: tenants.filter(t => t.isLicensed).length, bg: "bg-purple-50 dark:bg-purple-900/20" },
            { icon: <Settings className="h-5 w-5 text-orange-500" />, label: "Configs", value: configs.length, bg: "bg-orange-50 dark:bg-orange-900/20" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className={`p-5 ${s.bg} rounded-lg`}>
                <div className="flex items-center gap-3">
                  {s.icon}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 border rounded-xl p-1.5 w-fit shadow-sm">
          <button className={TAB("users")} onClick={() => setActiveTab("users")}>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />Users</span>
          </button>
          <button className={TAB("tenants")} onClick={() => setActiveTab("tenants")}>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />Tenants</span>
          </button>
          <button className={TAB("configs")} onClick={() => setActiveTab("configs")}>
            <span className="flex items-center gap-1.5"><Settings className="h-4 w-4" />Configs</span>
          </button>
        </div>

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />User Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-8 w-52" />
                    {userSearch && <button onClick={() => setUserSearch("")} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                  </div>
                  <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)} className="bg-[#1e3a5f] hover:bg-[#152d4a] flex items-center gap-1">
                    <Plus className="h-4 w-4" />New User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showCreateForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200 mb-3">Create New User</h3>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <Label>Username</Label>
                        <Input value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} placeholder="Username" required />
                      </div>
                      <div className="space-y-1">
                        <Label>Password</Label>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Password" required />
                          <button type="button" className="absolute right-2 top-2.5 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Tenant</Label>
                        <select value={formData.tenantId} onChange={e => setFormData(p => ({ ...p, tenantId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm" required>
                          <option value="">Select Tenant</option>
                          {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="bg-[#1e3a5f] hover:bg-[#152d4a]"><Plus className="h-4 w-4 mr-1" />Create</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowCreateForm(false); setFormData({ username: "", password: "", tenantId: "" }); }}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}
              {isLoadingUsers ? (
                <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">{userSearch ? "No users match your search." : "No users found."}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Username</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Tenant</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Status</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Created</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Updated By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{user.username}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{user.tenant.name} <span className="text-xs text-gray-400">({user.tenant.subdomain})</span></td>
                          <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.rowStatusCd === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.rowStatusCd === "A" ? "Active" : "Inactive"}</span></td>
                          <td className="px-3 py-2.5 text-gray-500">{formatDate(user.createdAt)}</td>
                          <td className="px-3 py-2.5 text-gray-500">{user.updatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2 text-right">{filteredUsers.length} of {users.length} users</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── TENANTS TAB ── */}
        {activeTab === "tenants" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Tenant Management</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search tenants..." value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} className="pl-8 w-52" />
                  {tenantSearch && <button onClick={() => setTenantSearch("")} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTenants ? (
                <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" /></div>
              ) : filteredTenants.length === 0 ? (
                <div className="text-center py-10 text-gray-400">{tenantSearch ? "No tenants match your search." : "No tenants found."}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Tenant</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Subdomain</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Source</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Licence</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Status</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Data</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Created</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(tenant => (
                        <tr key={tenant.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                            {tenant.name}
                            {tenant.storeName && tenant.storeName !== tenant.name && <div className="text-xs text-gray-400">{tenant.storeName}</div>}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{tenant.subdomain}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tenant.signupSource === "signup" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{tenant.signupSource ?? "admin"}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {tenant.isLicensed
                              ? <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full w-fit"><BadgeCheck className="h-3 w-3" />Licensed</span>
                              : <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit"><Ban className="h-3 w-3" />Free</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tenant.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{tenant.isActive ? "Active" : "Inactive"}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">
                            {tenant._count && <span title={`${tenant._count.userLogins} users · ${tenant._count.bookings} bookings · ${tenant._count.customers} customers · ${tenant._count.products} products`}>👥{tenant._count.userLogins} 📦{tenant._count.bookings}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500">{formatDate(tenant.createdAt)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEditTenant(tenant)} className="p-1.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-500 hover:text-blue-600 transition-colors" title="Edit tenant"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteTenant(tenant)} className="p-1.5 rounded border border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-500 hover:text-red-600 transition-colors" title="Delete tenant"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2 text-right">{filteredTenants.length} of {tenants.length} tenants</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── CONFIGS TAB ── */}
        {activeTab === "configs" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configuration Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search configs..." value={configSearch} onChange={e => setConfigSearch(e.target.value)} className="pl-8 w-48" />
                    {configSearch && <button onClick={() => setConfigSearch("")} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                  </div>
                  <Button size="sm" onClick={() => setShowCreateConfigForm(!showCreateConfigForm)} className="bg-[#1e3a5f] hover:bg-[#152d4a] flex items-center gap-1">
                    <Plus className="h-4 w-4" />Add Config
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showCreateConfigForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200 mb-3">New Configuration</h3>
                  <form onSubmit={handleCreateConfig}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1"><Label>Config Name</Label><Input value={configFormData.configName} onChange={e => setConfigFormData(p => ({ ...p, configName: e.target.value }))} placeholder="Config name" required /></div>
                      <div className="space-y-1"><Label>Description</Label><Input value={configFormData.description} onChange={e => setConfigFormData(p => ({ ...p, description: e.target.value }))} placeholder="Description" required /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="bg-[#1e3a5f] hover:bg-[#152d4a]"><Plus className="h-4 w-4 mr-1" />Create</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowCreateConfigForm(false); setConfigFormData({ configName: "", description: "" }); }}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}
              {showEditConfigForm && editingConfig && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-sm text-blue-700 mb-3">Edit Configuration</h3>
                  <form onSubmit={handleEditConfig}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1"><Label>Config Name</Label><Input value={configFormData.configName} onChange={e => setConfigFormData(p => ({ ...p, configName: e.target.value }))} required /></div>
                      <div className="space-y-1"><Label>Description</Label><Input value={configFormData.description} onChange={e => setConfigFormData(p => ({ ...p, description: e.target.value }))} required /></div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="bg-[#1e3a5f] hover:bg-[#152d4a]"><Edit className="h-4 w-4 mr-1" />Update</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowEditConfigForm(false); setEditingConfig(null); setConfigFormData({ configName: "", description: "" }); }}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}
              {isLoadingConfigs ? (
                <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" /></div>
              ) : filteredConfigs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">{configSearch ? "No configs match your search." : "No configurations found."}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Name</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Description</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Status</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Modified By</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConfigs.map(config => (
                        <tr key={config.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{config.configName}</td>
                          <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{config.description}</td>
                          <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.rowStatusCd === "A" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{config.rowStatusCd === "A" ? "Active" : "Inactive"}</span></td>
                          <td className="px-3 py-2.5 text-gray-500">{config.modifiedBy}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEditConfigForm(config)} className="p-1.5 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-500 hover:text-blue-600 transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDeleteConfig(config.id)} className="p-1.5 rounded border border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2 text-right">{filteredConfigs.length} of {configs.length} configs</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Tenant Modal */}
      {showEditTenant && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditTenant(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-[#1e3a5f]" />Edit Tenant
              </h2>
              <button onClick={() => setShowEditTenant(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditTenant} className="space-y-4">
              <div className="space-y-1">
                <Label>Tenant Name</Label>
                <Input value={tenantFormData.name} onChange={e => setTenantFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Store Name</Label>
                <Input value={tenantFormData.storeName} onChange={e => setTenantFormData(p => ({ ...p, storeName: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-purple-500" />Licensed Account</p>
                  <p className="text-xs text-gray-500 mt-0.5">Unlimited bookings when licensed</p>
                </div>
                <button type="button" onClick={() => setTenantFormData(p => ({ ...p, isLicensed: !p.isLicensed }))} className={`relative w-12 h-6 rounded-full transition-colors ${tenantFormData.isLicensed ? "bg-purple-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tenantFormData.isLicensed ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" />Account Active</p>
                  <p className="text-xs text-gray-500 mt-0.5">Inactive tenants cannot log in</p>
                </div>
                <button type="button" onClick={() => setTenantFormData(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-12 h-6 rounded-full transition-colors ${tenantFormData.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tenantFormData.isActive ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 bg-[#1e3a5f] hover:bg-[#152d4a]">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => setShowEditTenant(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const AdminDashboardWithNoSSR = dynamic(() => Promise.resolve(AdminDashboard), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  ),
});

export default AdminDashboardWithNoSSR;
