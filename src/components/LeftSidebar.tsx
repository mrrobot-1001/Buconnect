import { mockUsers } from "@/lib/mock-data";
import { Card, CardContent, CardHeader } from "./ui/card";
import { UserAvatar } from "./UserAvatar";
import { Separator } from "./ui/separator";
import { Bookmark, Building, Rss } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export default function LeftSidebar() {
  // In a real app, you would get the logged-in user from a session.
  const currentUser = mockUsers[1];

  return (
    <div className="sticky top-24 space-y-4">
      <Card>
        <CardHeader className="p-0 relative h-16">
           <div className="w-full h-full bg-primary/20 rounded-t-lg"></div>
           <div className="absolute top-8 left-1/2 -translate-x-1/2">
             <UserAvatar user={currentUser} className="h-16 w-16 border-4 border-card" />
           </div>
        </CardHeader>
        <CardContent className="text-center pt-12 pb-4">
          <Link href={`/profile/${currentUser.id}`}>
            <h3 className="font-semibold hover:underline">{currentUser.name}</h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">{currentUser.role === 'STUDENT' ? currentUser.course : currentUser.profession}</p>
        </CardContent>
        <Separator />
        <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-semibold text-primary">125</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Profile Views</span>
                <span className="font-semibold text-primary">42</span>
            </div>
        </CardContent>
      </Card>
      <Card>
          <CardContent className="p-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
                <Rss className="h-4 w-4" /> My Feed
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
                <Bookmark className="h-4 w-4" /> Saved Posts
            </Button>
             <Button variant="ghost" className="w-full justify-start gap-2">
                <Building className="h-4 w-4" /> Companies
            </Button>
          </CardContent>
      </Card>
    </div>
  );
}
