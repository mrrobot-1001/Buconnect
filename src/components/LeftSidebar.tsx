"use client";

import { Card, CardContent, CardHeader } from "./ui/card";
import { UserAvatar } from "./UserAvatar";
import { Separator } from "./ui/separator";
import { Bookmark, Rss, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  bio?: string;
  profileImage?: string;
  course?: string;
  profession?: string;
}

export default function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [connections, setConnections] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user from localStorage
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Fetch full user profile data from API
        const userRes = await fetch(`/api/users/${user.id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);
          setConnections(userData._count?.following || 0);
          setProfileViews(userData.profile_views || 0);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (!currentUser) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="sticky top-24 space-y-4">
      {/* Profile Card */}
      <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="p-0 pb-0">
          <div className="relative h-16 bg-gradient-to-r from-blue-50 to-indigo-50"></div>
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <div className="h-16 w-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
              <UserAvatar user={currentUser} className="h-16 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center pt-12 pb-4">
          <Link href={`/profile/${currentUser.id}`}>
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{currentUser.name}</h3>
          </Link>
          <p className="text-xs text-gray-500 mt-1 truncate">{currentUser.role === 'STUDENT' ? currentUser.course : currentUser.profession}</p>
        </CardContent>
        <Separator className="bg-gray-100" />
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Connections</span>
            <span className="font-semibold text-blue-600">{isLoading ? '-' : connections}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Profile Views</span>
            <span className="font-semibold text-blue-600">{isLoading ? '-' : profileViews}</span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Card */}
      <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          <Button 
            onClick={() => router.push('/feed')}
            className={`w-full justify-start gap-3 rounded-lg font-medium transition-all h-9 ${
              isActive('/feed')
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            variant="ghost"
          >
            <Rss className="h-4 w-4" /> My Feed
          </Button>
          <Button 
            onClick={() => router.push('/network')}
            className={`w-full justify-start gap-3 rounded-lg font-medium transition-all h-9 ${
              isActive('/network')
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            variant="ghost"
          >
            <Users className="h-4 w-4" /> Network
          </Button>
          <Button 
            onClick={() => router.push('/saved')}
            className={`w-full justify-start gap-3 rounded-lg font-medium transition-all h-9 ${
              isActive('/saved')
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            variant="ghost"
          >
            <Bookmark className="h-4 w-4" /> Saved Posts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
