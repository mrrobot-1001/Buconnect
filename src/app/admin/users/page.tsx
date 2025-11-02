"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/mock-data";
import { MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all users in the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">
                  Details
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Joined At
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map(user => (
                <TableRow key={user.id}>
                    <TableCell className="hidden sm:table-cell">
                        <UserAvatar user={user} className="h-10 w-10"/>
                    </TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/profile/${user.id}`} className="hover:underline">{user.name}</Link>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'ALUMNI' ? 'default' : 'secondary'}>
                            {user.role}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {user.role === 'ALUMNI' ? user.profession : user.course}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {format(new Date(user.createdAt), "MMMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
