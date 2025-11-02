import AppLayout from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { mockPosts, mockUsers } from "@/lib/mock-data";
import { Mail, Plus, Briefcase, GraduationCap, MapPin } from "lucide-react";
import Image from "next/image";

type ProfilePageProps = {
    params: { id: string };
};

export default function ProfilePage({ params }: ProfilePageProps) {
    // In a real app, you would fetch user data from your database based on params.id
    const user = mockUsers.find(u => u.id === params.id) || mockUsers[0];
    const userPosts = mockPosts.filter(p => p.authorId === user.id);

    return (
        <AppLayout>
           <div className="space-y-6">
            <Card>
                <CardHeader className="p-0">
                    <div className="relative h-28 md:h-40">
                         <Image src="https://picsum.photos/seed/cover1/1200/300" alt="Cover image" fill className="object-cover rounded-t-lg" data-ai-hint="abstract texture" />
                    </div>
                     <div className="p-4 sm:p-6 pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20">
                           <UserAvatar user={user} className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-card" />
                           <div className="mt-2 sm:ml-4 flex-1">
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                                <p className="text-muted-foreground text-sm sm:text-base">{user.bio}</p>
                           </div>
                           <div className="flex gap-2 mt-4 sm:mt-0">
                                <Button className="bg-primary hover:bg-primary/90 gap-2"><Plus className="h-4 w-4"/> Connect</Button>
                                <Button variant="outline" className="gap-2"><Mail className="h-4 w-4"/> Message</Button>
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
                            <span className="font-bold">125</span> <span className="text-muted-foreground">Connections</span>
                        </div>
                         <div>
                            <span className="font-bold">42</span> <span className="text-muted-foreground">Profile Views</span>
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
