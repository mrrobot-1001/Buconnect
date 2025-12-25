"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Mail, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    course: "",
    batch: "",
    profession: "",
  });

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to resend verification email",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Sent",
        description: "Verification email has been resent. Please check your inbox.",
      });
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: "An error occurred while resending the email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
      toast({
        title: "Error",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          course: formData.course || null,
          batch: formData.batch ? parseInt(formData.batch) : null,
          profession: formData.profession || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Registration failed",
          variant: "destructive",
        });
        return;
      }

      // Show verification email sent screen
      setRegisteredEmail(formData.email);
      setRegistrationComplete(true);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification email sent screen
  if (registrationComplete) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans p-4 items-center justify-center">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm max-w-md w-full">
          <CardHeader className="text-center space-y-4 p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Check Your Email! 📧
              </CardTitle>
              <CardDescription className="pt-2">
                We've sent a verification link to your email
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-blue-800 text-center">
                <span className="font-semibold">{registeredEmail}</span>
              </p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p>Click the verification link in your email to activate your account</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p>After verification, you can log in with your credentials</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p>Check your spam folder if you don't see the email</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </Button>
              
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans p-4">
      <div className="w-full max-w-2xl mx-auto my-8">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Join BUConnect 🚀
              </CardTitle>
              <CardDescription className="pt-2">
                Join the BUConnect community today.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  className="text-base"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="text-base"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="text-base pr-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select
                  required
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role" className="text-base">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="ALUMNI">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "STUDENT" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      placeholder="e.g., Computer Science"
                      className="text-base"
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Graduation Year</Label>
                    <Input
                      id="batch"
                      type="number"
                      placeholder="e.g., 2025"
                      className="text-base"
                      value={formData.batch}
                      onChange={(e) =>
                        setFormData({ ...formData, batch: e.target.value })
                      }
                      min="2000"
                      max="2030"
                    />
                  </div>
                </>
              )}

              {formData.role === "ALUMNI" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="profession">Current Position</Label>
                    <Input
                      id="profession"
                      placeholder="e.g., Software Engineer @ Google"
                      className="text-base"
                      value={formData.profession}
                      onChange={(e) =>
                        setFormData({ ...formData, profession: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      placeholder="e.g., Computer Science"
                      className="text-base"
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Graduation Year</Label>
                    <Input
                      id="batch"
                      type="number"
                      placeholder="e.g., 2018"
                      className="text-base"
                      value={formData.batch}
                      onChange={(e) =>
                        setFormData({ ...formData, batch: e.target.value })
                      }
                      min="2000"
                      max="2025"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/"
                className="font-semibold text-primary hover:underline"
              >
                Login
              </Link>
            </div>

            {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900 font-semibold mb-2">✨ Admin Demo Account</p>
              <p className="text-xs text-blue-800">Email: <code className="bg-white px-2 py-1 rounded">priya.s@example.com</code></p>
              <p className="text-xs text-blue-800">Password: <code className="bg-white px-2 py-1 rounded">password123</code></p>
              <p className="text-xs text-blue-700 mt-2">Try logging in with the admin account to access the admin dashboard!</p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
