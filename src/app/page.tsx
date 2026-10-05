"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Login with email and password
      const result = await login(trimmedEmail, password);

      if (!result.success) {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid email or password. Please try again.",
          variant: "destructive",
        });

        setIsLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect based on role - we need to fetch user to get role
      // For now redirect to feed, the layout will handle admin redirect
      router.push("/feed");
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
        <div className="relative z-10 text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BUConnect
            </h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Connect with alumni, discover opportunities, and build your professional network
            </p>
          </div>

          {/* Floating elements */}
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl">
                🎓
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Students & Alumni</h3>
                <p className="text-sm text-gray-600">Connect across batches</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-2xl">
                💼
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Career Opportunities</h3>
                <p className="text-sm text-gray-600">Find internships & jobs</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-2xl">
                🤝
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Mentorship</h3>
                <p className="text-sm text-gray-600">Learn from experienced alumni</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4 p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg lg:hidden">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent lg:hidden">
                  BUConnect
                </CardTitle>
                <CardTitle className="text-3xl font-bold text-gray-800 hidden lg:block">
                  Welcome Back! 👋
                </CardTitle>
                <CardDescription className="pt-2 text-base">
                  Sign in to continue your journey
                </CardDescription>
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
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* Test Credentials */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Quick Login (Test Accounts)</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEmail('rohan@example.com'); setPassword('password123'); }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-colors text-sm"
                  >
                    <p className="font-semibold text-blue-800">Student</p>
                    <p className="text-xs text-blue-600">rohan@example.com</p>
                    <p className="text-xs text-blue-500">password123</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('alisha.s@example.com'); setPassword('password123'); }}
                    className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left transition-colors text-sm"
                  >
                    <p className="font-semibold text-purple-800">Alumni</p>
                    <p className="text-xs text-purple-600">alisha.s@example.com</p>
                    <p className="text-xs text-purple-500">password123</p>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">Click to auto-fill credentials</p>
              </div>

              <div className="mt-6 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}