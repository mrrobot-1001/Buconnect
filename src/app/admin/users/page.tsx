"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import {
  Trash2,
  Edit2,
  Users,
  LogOut,
  Loader2,
  ArrowLeft,
  Filter,
  MoreHorizontal,
  Mail,
  GraduationCap,
  Briefcase,
  Calendar
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  course?: string;
  batch?: number;
  profession?: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        await fetchUsers();
      } catch (error) {
        console.error('Error parsing user:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers(currentPage, '');
    }
  }, [isAuthorized, userFilter, currentPage]);

  const fetchUsers = async (page = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?page=${page}&limit=10&role=${userFilter}&search=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          course: user.course,
          batch: user.batch,
          profession: user.profession,
          role: user.role
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map(u => u.id === user.id ? updated : u));
        setEditingUser(null);
        setEditDialogOpen(false);
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = userFilter === 'ALL' || user.role === userFilter;
    return matchesRole;
  });

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
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">User Management</h1>
              </div>
              <p className="text-muted-foreground text-sm">Manage and monitor user accounts</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 w-full md:w-auto">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
          <div className="w-full md:w-1/2">
            <Input
              placeholder="Search by name or email..."
              onChange={(e) => {
                const query = e.target.value;
                // Debounce search
                const timer = setTimeout(() => {
                  fetchUsers(1, query);
                }, 300);
                return () => clearTimeout(timer);
              }}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500/20 border-gray-200 min-w-[150px]"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="ALUMNI">Alumni</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b">
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600">Role</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600">Course</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600">Batch</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600">Profession</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm text-gray-600">Joined</th>
                  <th className="text-right py-4 px-6 font-semibold text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          user.role === 'STUDENT'
                            ? 'secondary'
                            : user.role === 'ALUMNI'
                              ? 'default'
                              : 'destructive'
                        }
                        className={`
                          ${user.role === 'STUDENT' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                          ${user.role === 'ALUMNI' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}
                          ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                          border-0 font-medium
                        `}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.role === 'STUDENT' ? (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          {user.course || '-'}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.role === 'STUDENT' ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {user.batch || '-'}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.role !== 'STUDENT' ? (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          {user.profession || '-'}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setEditingUser(user);
                            setEditDialogOpen(true);
                          }}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </Card>
        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Details</DialogTitle>
              <CardDescription>Update information for {editingUser?.name}</CardDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {editingUser.role === 'STUDENT' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        value={editingUser.course || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, course: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch Year</Label>
                      <Input
                        id="batch"
                        type="number"
                        value={editingUser.batch || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, batch: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      value={editingUser.profession || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, profession: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => editingUser && handleUpdateUser(editingUser)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
