"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Video, Send } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { mockUsers } from "@/lib/mock-data";

export function CreatePostForm() {
  const currentUser = mockUsers[1];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <UserAvatar user={currentUser} className="hidden sm:block" />
          <div className="w-full space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              className="w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-background resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                        <ImageIcon className="mr-2 h-4 w-4 text-primary" />
                        Photo
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Video className="mr-2 h-4 w-4 text-green-500" />
                        Video
                    </Button>
                </div>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Send className="mr-2 h-4 w-4" />
                    Post
                </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
