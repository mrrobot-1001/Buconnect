"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PostWithAuthor } from "@/lib/definitions";
import { Mail, Plus, Briefcase, GraduationCap, MapPin, Edit2, UserMinus, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
    bio: string | null;
    profileImage: string | null;
    profile_image: string | null;
    course: string | null;
    batch: number | null;
    profession: string | null;
    createdAt: string;
    created_at?: string;
    _count: {
        posts: number;
        followers: number;
        following: number;
    };
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.id as string;
    
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'NOT_CONNECTED' | 'PENDING' | 'CONNECTED'>('NOT_CONNECTED');

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: '',
        bio: '',
        course: '',
        batch: '',
        profession: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get current user from localStorage
                const currentUser = localStorage.getItem('user');
                const currentUserId = currentUser ? JSON.parse(currentUser).id : null;
                setIsOwnProfile(currentUserId === userId);

                // Fetch user profile
                const userRes = await fetch(`/api/users/${userId}`);
                if (!userRes.ok) throw new Error('Failed to fetch user');
                const userData = await userRes.json();
                setUser(userData);

                // Set edit form values
                setEditForm({
                    name: userData.name || '',
                    bio: userData.bio || '',
                    course: userData.course || '',
                    batch: userData.batch?.toString() || '',
                    profession: userData.profession || ''
                });

                // Fetch user posts
                const postsRes = await fetch(`/api/users/${userId}/posts`);
                if (!postsRes.ok) throw new Error('Failed to fetch posts');
                const postsData = await postsRes.json();
                setUserPosts(postsData);

                // Check connection status (only if not own profile)
                if (currentUserId && currentUserId !== userId) {
                    const requestsRes = await fetch(`/api/connections/requests?userId=${currentUserId}`);
                    if (requestsRes.ok) {
                        const { incoming, outgoing } = await requestsRes.json();
                        // Outgoing requests (sent by current user to this user)
                        const outgoingToThisUser = outgoing.find((r: any) => r.following_id === userId);
                        if (outgoingToThisUser) {
                            if (outgoingToThisUser.status === 'ACCEPTED') {
                                setConnectionStatus('CONNECTED');
                            } else if (outgoingToThisUser.status === 'PENDING') {
                                setConnectionStatus('PENDING');
                            }
                        }
                        // Incoming requests (sent by this user to current user)
                        const incomingFromThisUser = incoming.find((r: any) => r.follower_id === userId);
                        if (incomingFromThisUser && incomingFromThisUser.status === 'ACCEPTED') {
                            setConnectionStatus('CONNECTED');
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    const handleFollow = async () => {
        try {
            const currentUser = localStorage.getItem('user');
            if (!currentUser) {
                router.push('/register');
                return;
            }

            const currentUserId = JSON.parse(currentUser).id;

            if (isFollowing) {
                // Unfollow
                const res = await fetch('/api/connections', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ followerId: currentUserId, followingId: userId })
                });

                if (res.ok) {
                    setIsFollowing(false);
                    setUser(prev => prev ? {
                        ...prev,
                        _count: { ...prev._count, followers: prev._count.followers - 1 }
                    } : null);
                }
            } else {
                // Follow
                const res = await fetch('/api/connections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ followerId: currentUserId, followingId: userId })
                });

                if (res.ok) {
                    setIsFollowing(true);
                    setUser(prev => prev ? {
                        ...prev,
                        _count: { ...prev._count, followers: prev._count.followers + 1 }
                    } : null);
                }
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleConnect = async () => {
        try {
            const currentUser = localStorage.getItem('user');
            if (!currentUser) {
                router.push('/register');
                return;
            }
            const currentUserId = JSON.parse(currentUser).id;
            if (connectionStatus === 'PENDING') {
                // Cancel pending request
                const res = await fetch('/api/connections/requests', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender_id: currentUserId, recipient_id: userId })
                });
                if (res.ok) {
                    setConnectionStatus('NOT_CONNECTED');
                }
            } else if (connectionStatus === 'CONNECTED') {
                // Disconnect
                const res = await fetch('/api/connections/requests', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender_id: currentUserId, recipient_id: userId })
                });
                if (res.ok) {
                    setConnectionStatus('NOT_CONNECTED');
                }
            } else {
                // Send connection request
                const res = await fetch('/api/connections/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender_id: currentUserId, recipient_id: userId })
                });
                if (res.ok) {
                    setConnectionStatus('PENDING');
                }
            }
        } catch (error) {
            console.error('Error toggling connection:', error);
        }
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);

            const res = await fetch('/api/upload/profile-picture', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            
            const data = await res.json();
            setUser(prev => prev ? { 
                ...prev, 
                profile_image: data.url, 
                profileImage: data.url 
            } : null);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    bio: editForm.bio,
                    course: editForm.course || null,
                    batch: editForm.batch ? parseInt(editForm.batch) : null,
                    profession: editForm.profession || null
                })
            });

            if (!res.ok) throw new Error('Update failed');
            
            const updatedUser = await res.json();
            setUser(updatedUser);
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!user) {
        return (
            <AppLayout>
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">User not found</p>
                    </CardContent>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
           <div className="space-y-6">
            <Card>
                <CardHeader className="p-0">
                    <div className="relative h-28 md:h-40">
                         <Image 
                            src="https://picsum.photos/seed/cover1/1200/300" 
                            alt="Cover image" 
                            fill 
                            className="object-cover rounded-t-lg" 
                            data-ai-hint="abstract texture" 
                         />
                    </div>
                     <div className="p-4 sm:p-6 pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20">
                           <div className="relative">
                             <UserAvatar user={user} className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-card" />
                             {isOwnProfile && (
                               <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90">
                                 {uploading ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                 ) : (
                                   <Upload className="h-4 w-4" />
                                 )}
                                 <input
                                   type="file"
                                   accept="image/*"
                                   className="hidden"
                                   onChange={handleProfilePictureUpload}
                                   disabled={uploading}
                                 />
                               </label>
                             )}
                           </div>
                           <div className="mt-2 sm:ml-4 flex-1">
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                                <p className="text-muted-foreground text-sm sm:text-base">{user.bio}</p>
                           </div>
                           <div className="flex gap-2 mt-4 sm:mt-0">
                                {isOwnProfile ? (
                                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="gap-2">
                                        <Edit2 className="h-4 w-4" /> Edit Profile
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Edit Profile</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="name">Name</Label>
                                          <Input
                                            id="name"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="bio">Bio</Label>
                                          <Textarea
                                            id="bio"
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            rows={3}
                                          />
                                        </div>
                                        {user.role === 'STUDENT' && (
                                          <>
                                            <div>
                                              <Label htmlFor="course">Course</Label>
                                              <Input
                                                id="course"
                                                value={editForm.course}
                                                onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="batch">Batch Year</Label>
                                              <Input
                                                id="batch"
                                                type="number"
                                                value={editForm.batch}
                                                onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                                              />
                                            </div>
                                          </>
                                        )}
                                        {user.role === 'ALUMNI' && (
                                          <div>
                                            <Label htmlFor="profession">Profession</Label>
                                            <Input
                                              id="profession"
                                              value={editForm.profession}
                                              onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                                            />
                                          </div>
                                        )}
                                        <div className="flex justify-end gap-2">
                                          <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                            Cancel
                                          </Button>
                                          <Button onClick={handleUpdateProfile}>Save Changes</Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <>
                                    <Button
                                      onClick={handleConnect}
                                      variant={connectionStatus === 'PENDING' ? 'outline' : connectionStatus === 'CONNECTED' ? 'outline' : 'default'}
                                      className="gap-2"
                                    >
                                      {connectionStatus === 'CONNECTED' ? (
                                        <>
                                          <UserMinus className="h-4 w-4" /> Disconnect
                                        </>
                                      ) : connectionStatus === 'PENDING' ? (
                                        <>
                                          <UserMinus className="h-4 w-4" /> Cancel Request
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="h-4 w-4" /> Connect
                                        </>
                                      )}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="gap-2"
                                      onClick={() => router.push('/messaging')}
                                    >
                                      <Mail className="h-4 w-4" /> Message
                                    </Button>
                                  </>
                                )}
                           </div>
                        </div>
                        <div className="pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {user.role === 'ALUMNI' && user.profession && (
                                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{user.profession}</span>
                            )}
                            {user.role === 'STUDENT' && user.course && (
                                <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{user.course}</span>
                            )}
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />Your City, Country</span>
                        </div>
                     </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-8">
                        <div>
                            <span className="font-bold">{user._count.followers}</span> <span className="text-muted-foreground">Followers</span>
                        </div>
                         <div>
                            <span className="font-bold">{user._count.following}</span> <span className="text-muted-foreground">Following</span>
                        </div>
                         <div>
                            <span className="font-bold">{user._count.posts}</span> <span className="text-muted-foreground">Posts</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h3 className="text-xl font-bold mb-4">Activity</h3>
                 <div className="space-y-4">
                    {userPosts.length > 0 ? userPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    )) : (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No posts yet.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
           </div>
        </AppLayout>
    );
}
