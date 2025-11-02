"use client"

import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
       <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav
            className="grid gap-4 text-sm text-muted-foreground"
          >
            <Link href="#" className="font-semibold text-primary">
              General
            </Link>
            <Link href="#">Security</Link>
            <Link href="#">Integrations</Link>
            <Link href="#">Support</Link>
            <Link href="#">Organizations</Link>
            <Link href="#">Advanced</Link>
          </nav>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Name</CardTitle>
                <CardDescription>
                  Used to identify your platform in the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <Input placeholder="BUConnect" />
                </form>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button>Save</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
                <CardDescription>
                  Configure rules for automatic post and comment moderation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                     <Checkbox id="moderate-posts" defaultChecked />
                     <div className="grid gap-1.5 leading-none">
                        <label htmlFor="moderate-posts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Auto-flag posts for review
                        </label>
                        <p className="text-sm text-muted-foreground">
                            Enable automatic flagging of posts containing keywords.
                        </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <Checkbox id="moderate-comments" />
                     <div className="grid gap-1.5 leading-none">
                        <label htmlFor="moderate-comments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                           Auto-hide comments
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Automatically hide comments that violate community guidelines.
                        </p>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button>Save</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
    </AdminLayout>
  );
}
