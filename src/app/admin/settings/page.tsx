"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  ArrowLeft,
  LogOut,
  Shield,
  Bell,
  Lock,
  Globe,
  Database,
  Mail
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-gray-700" />
                <h1 className="text-2xl font-bold">Platform Settings</h1>
              </div>
              <p className="text-muted-foreground text-sm">Configure global application preferences</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 w-full md:w-auto">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Navigation */}
          <Card className="w-full lg:w-64 flex-shrink-0 border-0 shadow-sm sticky top-6">
            <CardContent className="p-4">
              <nav className="flex flex-col space-y-1">
                <Button variant="ghost" className="justify-start gap-2 font-medium bg-gray-100 text-gray-900">
                  <Globe className="h-4 w-4" />
                  General
                </Button>
                <Button variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-gray-900">
                  <Shield className="h-4 w-4" />
                  Security & Access
                </Button>
                <Button variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-gray-900">
                  <Bell className="h-4 w-4" />
                  Notifications
                </Button>
                <Button variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-gray-900">
                  <Database className="h-4 w-4" />
                  Data Management
                </Button>
                <Button variant="ghost" className="justify-start gap-2 text-muted-foreground hover:text-gray-900">
                  <Mail className="h-4 w-4" />
                  Email Settings
                </Button>
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="flex-1 space-y-6 w-full">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Basic configuration for the platform identity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="BUConnect" />
                  <p className="text-xs text-muted-foreground">This name will appear in emails and the dashboard header.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" defaultValue="support@buconnect.edu" />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 border-t px-6 py-4 flex justify-end">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            {/* Content Moderation */}
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>
                  Automated rules for managing user content and safety.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-flag sensitive content</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically flag posts containing potential policy violations for review.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require approval for new users</Label>
                    <p className="text-sm text-muted-foreground">
                      New accounts must be approved by an admin before posting.
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-3">
                  <Label>Restricted Keywords</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Add keyword..." className="max-w-xs" />
                    <Button variant="secondary">Add</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Posts containing these words will be automatically hidden.</p>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 border-t px-6 py-4 flex justify-end">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            {/* System Status */}
            <Card className="border-red-100">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for system maintenance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/30">
                  <div>
                    <h4 className="font-medium text-red-900">Maintenance Mode</h4>
                    <p className="text-sm text-red-700">Disable access for all non-admin users.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
