"use client";

import { useState, useEffect } from "react";
import { User, Settings, Lock, Save, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { apiGet, apiPut } from "@/lib/api-client";
import dynamic from "next/dynamic";

interface TenantProfile {
  id: number;
  name: string;
  username: string | null;
  password: string | null;
  storeName: string | null;
  storeEmail: string | null;
  subdomain: string;
}

interface ProfileFormData {
  name: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

function ProfileDrawerComponent() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  // Prevent hydration issues
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  const fetchProfile = async () => {
    if (!user?.tenantId) {
      setMessage("No tenant information available");
      return;
    }

    try {
      setIsLoading(true);
      // Use authenticated user's tenant ID for security
      const response = await apiGet(
        `/api/tenant/profile?tenantId=${user.tenantId}`
      );
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          currentPassword: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setMessage("Failed to load profile");
      }
    } catch (error) {
      setMessage("Error loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage(""); // Clear message when user types
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Name is required";
    }
    if (formData.password && !formData.currentPassword) {
      return "Current password is required to set a new password";
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (formData.password && formData.password.length < 6) {
      return "New password must be at least 6 characters";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setIsSaving(true);
      setMessage("");

      const updateData: any = {
        tenantId: user?.tenantId,
        userId: user?.id,
        name: formData.name,
      };

      if (formData.password) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.password;
      }

      const response = await apiPut("/api/tenant/profile", updateData);

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile.tenant);
        setMessage("Profile updated successfully!");
        setFormData((prev) => ({ ...prev, currentPassword: "", password: "", confirmPassword: "" }));
        setShowPasswordSection(false);

        // Close drawer after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
          setMessage("");
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      setMessage("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user ? getInitials(user.username) : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </SheetTitle>
          <SheetDescription>
            Update your profile information and credentials.
          </SheetDescription>
          {user && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Current User:</span> {user.username}
              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Tenant ID: {user.tenantId}
              </span>
            </div>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 max-h-[calc(100vh-200px)]">
              {message && (
                <div
                  className={`p-3 rounded-md text-sm ${
                    message.includes("successfully")
                      ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={profile?.subdomain || ""}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Subdomain cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-email">Store Email</Label>
                  <Input
                    id="store-email"
                    value={profile?.storeEmail || "Not set"}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update store email in{" "}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Store Settings
                    </button>
                  </p>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </h3>
                  {!showPasswordSection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordSection(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                  )}
                </div>

                {showPasswordSection && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) =>
                          handleInputChange("currentPassword", e.target.value)
                        }
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setFormData((prev) => ({
                          ...prev,
                          currentPassword: "",
                          password: "",
                          confirmPassword: "",
                        }));
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div className="flex-shrink-0 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Create a client-only version to prevent hydration issues
const ProfileDrawerClientOnly = dynamic(
  () => Promise.resolve(ProfileDrawerComponent),
  {
    ssr: false,
    loading: () => (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    ),
  }
);

export { ProfileDrawerClientOnly as ProfileDrawer };
