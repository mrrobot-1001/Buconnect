"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockPosts } from "@/lib/mock-data";
import { MoreHorizontal } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";

export default function AdminPostsPage() {
  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Manage all posts on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="hidden md:table-cell">
                  Likes
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Comments
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Created at
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="hidden sm:table-cell">
                    {post.imageUrl && (
                        <Image
                            alt={post.title}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={post.imageUrl}
                            width="64"
                        />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {post.title}
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={post.author} className="h-6 w-6"/>
                        <span className="text-sm">{post.author.name}</span>
                      </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post._count.likes}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post._count.comments}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(post.createdAt), "MMMM d, yyyy")}
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
                        <DropdownMenuItem>View Post</DropdownMenuItem>
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
