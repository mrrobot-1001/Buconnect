"use client";

import { useEffect, useState, useCallback } from "react";
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
import { ImageCropper } from "@/components/ImageCropper";
import type { PostWithAuthor } from "@/lib/definitions";
import { Mail, Plus, Briefcase, GraduationCap, MapPin, Edit2, UserMinus, Upload, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

// Constants for image upload
const MAX_FILE_SIZE_MB = 5; // Max file size before compression
const MAX_COMPRESSED_SIZE_KB = 500; // Max size after compression

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

type ConnectionStatus = 'CONNECTED' | 'PENDING' | 'NOT_CONNECTED';

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { currentUser: contextUser, updateUserProfile } = useUser();
    const userId = params?.id as string;
    
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('NOT_CONNECTED');
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Image cropper state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                const currentUserStr = localStorage.getItem('currentUser');
                const currentUserId = currentUserStr ? JSON.parse(currentUserStr).id : null;
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
                    try {
                        const requestsRes = await fetch(`/api/connections/requests?userId=${currentUserId}`);
                        if (requestsRes.ok) {
                            const { incoming, outgoing } = await requestsRes.json();
                            
                            // Check outgoing requests (sent by current user to this user)
                            const outgoingToThisUser = outgoing.find(
                                (r: any) => r.following_id === userId
                            );
                            
                            if (outgoingToThisUser) {
                                if (outgoingToThisUser.status === 'ACCEPTED') {
                                    setConnectionStatus('CONNECTED');
                                } else if (outgoingToThisUser.status === 'PENDING') {
                                    setConnectionStatus('PENDING');
                                }
                            }
                            
                            // Also check incoming requests (sent by this user to current user)
                            const incomingFromThisUser = incoming.find(
                                (r: any) => r.follower_id === userId
                            );
                            
                            if (incomingFromThisUser && incomingFromThisUser.status === 'ACCEPTED') {
                                setConnectionStatus('CONNECTED');
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching connection status:', err);
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

    const handleConnect = async () => {
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) {
                router.push('/');
                return;
            }

            const currentUserId = JSON.parse(currentUserStr).id;

            if (connectionStatus === 'PENDING') {
                // Cancel pending request
                const res = await fetch('/api/connections/requests', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        sender_id: currentUserId,
                        recipient_id: userId 
                    })
                });

                if (res.ok) {
                    setConnectionStatus('NOT_CONNECTED');
                }
            } else if (connectionStatus === 'NOT_CONNECTED') {
                // Send connection request
                const res = await fetch('/api/connections/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        sender_id: currentUserId,
                        recipient_id: userId 
                    })
                });

                if (res.ok) {
                    setConnectionStatus('PENDING');
                }
            }
        } catch (error) {
            console.error('Error toggling connection:', error);
            alert('Failed to send connection request');
        }
    };

    const handleDisconnect = async () => {
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) return;

            const currentUserId = JSON.parse(currentUserStr).id;

            const res = await fetch('/api/connections/requests', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sender_id: currentUserId,
                    recipient_id: userId 
                })
            });

            if (res.ok) {
                setConnectionStatus('NOT_CONNECTED');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Failed to disconnect');
        }
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please select an image file (JPG, PNG, GIF, etc.)",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (before compression)
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast({
                title: "File too large",
                description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB`,
                variant: "destructive",
            });
            return;
        }

        // Create a preview URL and open the cropper
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        setCropperOpen(true);
        
        // Reset the input so the same file can be selected again
        e.target.value = '';
    };

    const handleCroppedImage = async (croppedBlob: Blob) => {
        try {
            setUploading(true);
            
            // Clean up the object URL
            if (selectedImage) {
                URL.revokeObjectURL(selectedImage);
                setSelectedImage(null);
            }

            const formData = new FormData();
            formData.append('file', croppedBlob, 'profile-picture.jpg');
            formData.append('userId', userId);

            const res = await fetch('/api/upload/profile-picture', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const data = await res.json();
            
            // Update local user state
            setUser(prev => prev ? { 
                ...prev, 
                profile_image: data.url, 
                profileImage: data.url 
            } : null);

            // Update context to propagate to all components in real-time
            if (contextUser?.id === userId) {
                updateUserProfile({
                    profile_image: data.url,
                    profileImage: data.url
                });
            }

            toast({
                title: "Success",
                description: "Profile picture updated successfully!",
            });
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload profile picture",
                variant: "destructive",
            });
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
            
            // Update context to propagate changes to all components
            if (contextUser?.id === userId) {
                updateUserProfile({
                    name: updatedUser.name,
                    bio: updatedUser.bio,
                    course: updatedUser.course,
                    batch: updatedUser.batch,
                    profession: updatedUser.profession,
                });
            }
            
            setEditDialogOpen(false);
            toast({
                title: "Success",
                description: "Profile updated successfully!",
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive",
            });
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
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-0 pb-0">
                    {/* Profile Header without banner */}
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                            {/* Profile Picture */}
                            <div className="relative flex-shrink-0">
                                <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                                    <UserAvatar user={user} className="h-32 w-32" />
                                </div>
                                {isOwnProfile && (
                                   <label className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-full cursor-pointer hover:shadow-lg transition-all hover:scale-110">
                                     {uploading ? (
                                       <Loader2 className="h-5 w-5 animate-spin" />
                                     ) : (
                                       <Upload className="h-5 w-5" />
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

                            {/* Profile Info */}
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                        <p className="text-gray-600 text-sm sm:text-base mt-1">{user.bio || 'No bio added yet'}</p>
                                        
                                        {/* Role and Details */}
                                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                                {user.role === 'STUDENT' ? (
                                                    <>
                                                        <GraduationCap className="h-4 w-4" />
                                                        {user.course || 'Student'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Briefcase className="h-4 w-4" />
                                                        {user.profession || user.role}
                                                    </>
                                                )}
                                            </span>
                                            {user.role === 'STUDENT' && user.batch && (
                                                <span className="text-sm text-gray-600 font-medium">Batch {user.batch}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 sm:ml-auto">
                                        {isOwnProfile ? (
                                          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                            <DialogTrigger asChild>
                                              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2 shadow-md">
                                                <Edit2 className="h-4 w-4" /> Edit Profile
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                              <DialogHeader>
                                                <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
                                              </DialogHeader>
                                              <div className="space-y-4">
                                                <div>
                                                  <Label htmlFor="name" className="font-semibold">Full Name</Label>
                                                  <Input
                                                    id="name"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    placeholder="Enter your full name"
                                                    className="mt-1"
                                                  />
                                                </div>
                                                <div>
                                                  <Label htmlFor="bio" className="font-semibold">Bio</Label>
                                                  <Textarea
                                                    id="bio"
                                                    value={editForm.bio}
                                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                    placeholder="Tell us about yourself"
                                                    rows={3}
                                                    className="mt-1"
                                                  />
                                                </div>
                                                {user.role === 'STUDENT' && (
                                                  <>
                                                    <div>
                                                      <Label htmlFor="course" className="font-semibold">Course</Label>
                                                      <Input
                                                        id="course"
                                                        value={editForm.course}
                                                        onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                                                        placeholder="Your course name"
                                                        className="mt-1"
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label htmlFor="batch" className="font-semibold">Batch Year</Label>
                                                      <Input
                                                        id="batch"
                                                        type="number"
                                                        value={editForm.batch}
                                                        onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                                                        placeholder="e.g., 2024"
                                                        className="mt-1"
                                                      />
                                                    </div>
                                                  </>
                                                )}
                                                {user.role === 'ALUMNI' && (
                                                  <div>
                                                    <Label htmlFor="profession" className="font-semibold">Profession</Label>
                                                    <Input
                                                      id="profession"
                                                      value={editForm.profession}
                                                      onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                                                      placeholder="Your profession"
                                                      className="mt-1"
                                                    />
                                                  </div>
                                                )}
                                                <div className="flex justify-end gap-2 pt-4">
                                                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                                    Cancel
                                                  </Button>
                                                  <Button 
                                                    onClick={handleUpdateProfile}
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                                  >
                                                    Save Changes
                                                  </Button>
                                                </div>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        ) : (
                                          <>
                                            {connectionStatus === 'CONNECTED' ? (
                                              <div className="flex flex-col gap-2">
                                                <Button 
                                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white gap-2"
                                                  onClick={() => router.push('/messaging')}
                                                >
                                                  <Mail className="h-4 w-4" /> Message
                                                </Button>
                                                <Button 
                                                  variant="outline" 
                                                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                                  onClick={handleDisconnect}
                                                >
                                                  <UserMinus className="h-4 w-4" /> Disconnect
                                                </Button>
                                              </div>
                                            ) : (
                                              <Button
                                                onClick={handleConnect}
                                                className={`gap-2 ${
                                                  connectionStatus === 'PENDING'
                                                    ? 'border-blue-300 text-blue-600 hover:bg-blue-50'
                                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                                }`}
                                                variant={connectionStatus === 'PENDING' ? 'outline' : 'default'}
                                              >
                                                {connectionStatus === 'PENDING' ? (
                                                  <>
                                                    <UserMinus className="h-4 w-4" /> Cancel Request
                                                  </>
                                                ) : (
                                                  <>
                                                    <Plus className="h-4 w-4" /> Connect
                                                  </>
                                                )}
                                              </Button>
                                            )}
                                          </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* Stats Section */}
                <CardContent className="p-6 sm:p-8 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{user._count?.followers || 0}</p>
                            <p className="text-sm text-gray-600 mt-1">Followers</p>
                        </div>
                        <div className="text-center border-l border-r border-gray-200">
                            <p className="text-2xl font-bold text-blue-600">{user._count?.following || 0}</p>
                            <p className="text-sm text-gray-600 mt-1">Following</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{user._count?.posts || 0}</p>
                            <p className="text-sm text-gray-600 mt-1">Posts</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Section */}
            {user._count?.posts > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity</h2>
                    <div className="space-y-4">
                        {userPosts.map((post) => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onDelete={(postId) => {
                                    setUserPosts(prev => prev.filter(p => p.id !== postId));
                                    if (user) {
                                        setUser({
                                            ...user,
                                            _count: {
                                                ...user._count,
                                                posts: Math.max(0, user._count.posts - 1)
                                            }
                                        });
                                    }
                                }} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {user._count?.posts === 0 && (
                <Card className="border-0 shadow-sm bg-gray-50/50">
                    <CardContent className="p-12 text-center">
                        <p className="text-gray-500 text-lg">No posts yet</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {isOwnProfile ? "Start sharing your thoughts and experiences!" : "This user hasn't posted yet"}
                        </p>
                    </CardContent>
                </Card>
            )}
           </div>

            {/* Image Cropper Dialog */}
            {selectedImage && (
                <ImageCropper
                    open={cropperOpen}
                    onClose={() => {
                        setCropperOpen(false);
                        if (selectedImage) {
                            URL.revokeObjectURL(selectedImage);
                            setSelectedImage(null);
                        }
                    }}
                    imageSrc={selectedImage}
                    onCropComplete={handleCroppedImage}
                    aspectRatio={1}
                    maxSizeKB={MAX_COMPRESSED_SIZE_KB}
                />
            )}
        </AppLayout>
    );
}
