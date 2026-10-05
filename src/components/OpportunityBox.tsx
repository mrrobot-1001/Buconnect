"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Briefcase, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/button";

interface Post {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string;
        profileImage?: string | null;
    };
}

export default function OpportunityBox() {
    const [opportunities, setOpportunities] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchOpportunities = useCallback(async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setIsRefreshing(true);
        }
        try {
            const res = await fetch('/api/posts?hashtags=job,internship&limit=5', {
                cache: 'no-store',
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setOpportunities(data.posts || []);
            }
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOpportunities();

        // Poll every 10 seconds for new opportunities
        const intervalId = setInterval(() => fetchOpportunities(false), 10000);

        return () => clearInterval(intervalId);
    }, [fetchOpportunities]);

    const handleRefresh = () => {
        fetchOpportunities(true);
    };

    if (loading) {
        return (
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </CardContent>
            </Card>
        );
    }

    // Always render the card, even if empty (to show it exists)
    return (
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Briefcase className="h-4 w-4 text-orange-600" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">Opportunities</CardTitle>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-orange-100"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 text-orange-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                    Latest jobs & internships
                </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
                {opportunities.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No opportunities yet</p>
                        <p className="text-xs text-gray-400 mt-1">Post with #job or #internship</p>
                    </div>
                ) : (
                    opportunities.map((post) => (
                        <Link key={post.id} href={`/post/${post.id}`}>
                            <div className="group p-3 rounded-xl bg-white/60 hover:bg-white transition-all cursor-pointer border border-transparent hover:border-orange-100">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                        {post.title}
                                    </h4>
                                    <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100" />
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-2">
                                    <UserAvatar user={post.author} className="h-5 w-5" />
                                    <span className="text-xs text-gray-500">{post.author.name}</span>
                                    <span className="text-[10px] text-gray-400 ml-auto">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    );
}