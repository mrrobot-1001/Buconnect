"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { PostWithAuthor } from "@/lib/definitions";

export default function SinglePostPage() {
    const params = useParams();
    const router = useRouter();
    const [post, setPost] = useState<PostWithAuthor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchPost(params.id as string);
        }
    }, [params.id]);

    const fetchPost = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/posts/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPost(data);
            } else {
                setError("Post not found");
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            setError("Failed to load post");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </AppLayout>
        );
    }

    if (error || !post) {
        return (
            <AppLayout>
                <div className="space-y-4">
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Card className="border-0 shadow-md bg-red-50">
                        <CardContent className="p-8 text-center text-red-600">
                            <p>{error || "Post not found"}</p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PageHeader title="Post" backHref="/feed" />
            <PostCard
                post={post}
                defaultShowComments
                onDelete={() => router.push('/feed')}
            />
        </AppLayout>
    );
}
