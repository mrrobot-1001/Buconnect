"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Already signed in: go straight to the app
  useEffect(() => {
    if (!authLoading && user) router.replace("/feed");
  }, [authLoading, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, password);
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    signIn(demoEmail, "password123");
  };

  const signIn = async (email: string, password: string) => {
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4 p-6 sm:p-8">
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
            <CardContent className="p-5 sm:p-6">
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
                    autoComplete="email"
                    inputMode="email"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 text-base"
                  />
                </div>
                <Button type="submit" className="h-12 w-full bg-primary text-base font-semibold hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Try a demo account</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { label: "Student", email: "rohan@example.com", tone: "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800" },
                    { label: "Alumni", email: "alisha.s@example.com", tone: "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800" },
                  ].map(demo => (
                    <button
                      key={demo.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => quickLogin(demo.email)}
                      className={`flex min-h-[52px] min-w-0 flex-col justify-center rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-60 ${demo.tone}`}
                    >
                      <span className="text-sm font-semibold">Sign in as {demo.label}</span>
                      <span className="truncate text-xs opacity-75">{demo.email}</span>
                    </button>
                  ))}
                </div>
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