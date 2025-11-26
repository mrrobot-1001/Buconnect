"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  LogOut,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Settings,
  Shield,
  Activity
} from "lucide-react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalAlumni: number;
  totalAdmins: number;
  totalPosts: number;
  totalConnections: number;
  recentSignups: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string; email: string };
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalAdmins: 0,
    totalPosts: 0,
    totalConnections: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      const user = localStorage.getItem('currentUser');

      if (!user) {
        router.push('/');
        return;
      }

      try {
        const userData = JSON.parse(user);

        if (userData.role !== 'ADMIN') {
          router.push('/');
          return;
        }

        setCurrentUser(userData);
        setIsAuthorized(true);
        await fetchDashboardData();
      } catch (error) {
        console.error('Error parsing user:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersRes = await fetch('/api/admin/users?limit=100');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);

        // Calculate stats
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentUsers = usersData.users.filter((u: User) =>
          new Date(u.created_at) > lastWeek
        );

        const calculatedStats = {
          totalUsers: usersData.pagination.total,
          totalStudents: usersData.users.filter((u: User) => u.role === 'STUDENT').length,
          totalAlumni: usersData.users.filter((u: User) => u.role === 'ALUMNI').length,
          totalAdmins: usersData.users.filter((u: User) => u.role === 'ADMIN').length,
          totalPosts: 0,
          totalConnections: 0,
          recentSignups: recentUsers.length
        };

        // Fetch posts
        const postsRes = await fetch('/api/admin/posts?limit=100');
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts.slice(0, 5));
          calculatedStats.totalPosts = postsData.pagination.total;
        }

        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (!isAuthorized || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 p-4 md:p-0 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Welcome back, {currentUser?.name} 👋</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <div className="text-3xl font-bold mt-2 text-gray-900">{stats.totalUsers}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.recentSignups} new
                  </div>
                </div>
                <Users className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Alumni</p>
                  <div className="text-3xl font-bold mt-2 text-gray-900">{stats.totalAlumni}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stats.totalAlumni / stats.totalUsers) * 100).toFixed(1)}% of base
                  </p>
                </div>
                <UserCheck className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Students</p>
                  <div className="text-3xl font-bold mt-2 text-gray-900">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stats.totalStudents / stats.totalUsers) * 100).toFixed(1)}% of base
                  </p>
                </div>
                <Users className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Posts</p>
                  <div className="text-3xl font-bold mt-2 text-gray-900">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground mt-1">Platform activity</p>
                </div>
                <FileText className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Management & Quick Actions */}
          <div className="space-y-6">
            <Card className="border shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-gray-500" />
                  Management
                </CardTitle>
                <CardDescription>Quick access to admin tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-between bg-white hover:bg-gray-50 text-gray-900 border shadow-sm h-12">
                  <Link href="/admin/users">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </Button>

                <Button asChild className="w-full justify-between bg-white hover:bg-gray-50 text-gray-900 border shadow-sm h-12">
                  <Link href="/admin/posts">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-orange-100 rounded-md">
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-medium">Manage Posts</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </Button>

                <Button asChild className="w-full justify-between bg-white hover:bg-gray-50 text-gray-900 border shadow-sm h-12">
                  <Link href="/admin/settings">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-100 rounded-md">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="font-medium">Settings</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Activity & Overview (Spans 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Distribution */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">User Distribution</CardTitle>
                <CardDescription>Breakdown of platform user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5 mt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Students</span>
                      <span className="text-gray-500">{stats.totalStudents} ({((stats.totalStudents / stats.totalUsers) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(stats.totalStudents / stats.totalUsers) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Alumni</span>
                      <span className="text-gray-500">{stats.totalAlumni} ({((stats.totalAlumni / stats.totalUsers) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(stats.totalAlumni / stats.totalUsers) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Admins</span>
                      <span className="text-gray-500">{stats.totalAdmins} ({((stats.totalAdmins / stats.totalUsers) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(stats.totalAdmins / stats.totalUsers) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Posts */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    Recent Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {posts.slice(0, 3).map((post) => (
                      <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <p className="font-medium text-sm truncate text-gray-900">{post.title}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{post.author.name}</span>
                          <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {posts.length === 0 && (
                      <div className="p-6 text-center text-sm text-gray-500">No recent posts</div>
                    )}
                  </div>
                  <div className="p-3 border-t bg-gray-50/50">
                    <Link href="/admin/posts" className="text-xs font-medium text-blue-600 hover:underline flex items-center justify-center">
                      View all posts
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    New Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {users.slice(0, 3).map((user) => (
                      <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t bg-gray-50/50">
                    <Link href="/admin/users" className="text-xs font-medium text-blue-600 hover:underline flex items-center justify-center">
                      View all users
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
