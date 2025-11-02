import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { mockUsers } from "@/lib/mock-data";
import { UserAvatar } from "./UserAvatar";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Separator } from "./ui/separator";

export default function RightSidebar() {
    const recommendedUsers = mockUsers.filter(u => u.role !== 'STUDENT');
  return (
    <div className="sticky top-24 space-y-4">
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">Recommended Connections</CardTitle>
                <CardDescription className="text-xs">Alumni and faculty you might know.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
                {recommendedUsers.slice(0, 4).map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <Link href={`/profile/${user.id}`}>
                            <UserAvatar user={user} className="h-10 w-10" />
                        </Link>
                        <div className="flex-1">
                            <Link href={`/profile/${user.id}`}>
                                <h4 className="text-sm font-semibold hover:underline">{user.name}</h4>
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">{user.profession}</p>
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Connect</span>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
                <div>
                    <p className="text-sm font-semibold hover:underline cursor-pointer">#JobOpenings</p>
                    <p className="text-xs text-muted-foreground">1,205 posts</p>
                </div>
                <Separator />
                 <div>
                    <p className="text-sm font-semibold hover:underline cursor-pointer">#TechTalks</p>
                    <p className="text-xs text-muted-foreground">890 posts</p>
                </div>
                 <Separator />
                 <div>
                    <p className="text-sm font-semibold hover:underline cursor-pointer">#ProjectHelp</p>
                    <p className="text-xs text-muted-foreground">532 posts</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
