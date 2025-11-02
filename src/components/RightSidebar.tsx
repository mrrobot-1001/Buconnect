import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { mockUsers } from "@/lib/mock-data";
import { UserAvatar } from "./UserAvatar";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function RightSidebar() {
    const recommendedUsers = mockUsers.filter(u => u.role !== 'STUDENT');
  return (
    <div className="sticky top-24 space-y-4">
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Recommended Connections</CardTitle>
                <CardDescription className="text-xs">Alumni and faculty you might know.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <Link href={`/profile/${user.id}`}>
                            <UserAvatar user={user} className="h-10 w-10" />
                        </Link>
                        <div className="flex-1">
                            <Link href={`/profile/${user.id}`}>
                                <h4 className="text-sm font-semibold hover:underline">{user.name}</h4>
                            </Link>
                            <p className="text-xs text-muted-foreground">{user.profession}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                            <Plus className="h-3 w-3" /> Connect
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
