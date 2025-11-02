"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockUsers } from "@/lib/mock-data";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd handle authentication here.
    const user = mockUsers.find(u => u.email === email);
    
    if (user?.role === 'ADMIN') {
        router.push("/admin");
    } else {
        router.push("/feed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4 p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
                <CardTitle className="text-3xl font-bold text-primary">BUConnect</CardTitle>
                <CardDescription className="pt-2">Welcome back! Please login to your account.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-sm text-primary/80 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="text-base"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
                Login
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground space-y-1">
              <p><span className="font-semibold">Admin:</span> priya.s@example.com</p>
              <p><span className="font-semibold">Student:</span> rohan@example.com</p>
              <p>(Use any password)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
