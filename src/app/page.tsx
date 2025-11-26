"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setCurrentUser } from "@/lib/auth";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to send verification email",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Sent",
        description: "Please check your inbox for the verification link",
      });
      setShowResendVerification(false);
      setResendEmail('');
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Login with email and password (handles both admin and regular users)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password
        }),
      });

      const data = await response.json();

      console.log('Login response:', { status: response.status, data });

      if (!response.ok) {
        console.error('Login failed:', data);

        // If email not verified, show option to resend
        if (response.status === 403 && data.error?.includes('verify')) {
          toast({
            title: "Verification Required",
            description: "Please verify your email. You can request a new link below.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: data.error || "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        }

        setIsLoading(false);
        return;
      }

      // Store user in localStorage
      setCurrentUser(data.user);

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push("/admin");
      } else {
        router.push("/feed");
      }
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
                  {showResendVerification ? "Verify Email 📧" : "Welcome Back! 👋"}
                </CardTitle>
                <CardDescription className="pt-2 text-base">
                  {showResendVerification
                    ? "Enter your email to receive a new verification link"
                    : "Sign in to continue your journey"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {showResendVerification ? (
                <form onSubmit={handleResendVerification} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="resend-email">Email Address</Label>
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="text-base"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isResending}>
                    {isResending ? "Sending..." : "Send Verification Link"}
                  </Button>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowResendVerification(false)}
                      className="text-sm text-gray-600 hover:text-primary"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              ) : (
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

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowResendVerification(true)}
                      className="text-xs text-gray-500 hover:text-primary"
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                </form>
              )}

              {!showResendVerification && (
                <div className="mt-6 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">
                    Sign up
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
