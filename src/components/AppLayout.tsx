"use client";

import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated (after loading completes)
    if (!isLoading && !currentUser) {
      router.push('/');
    }
  }, [isLoading, currentUser, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse"></div>
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto grid grid-cols-12 gap-6 px-4 pt-24 pb-8 max-w-7xl">
        <aside className="hidden md:block md:col-span-3">
          <LeftSidebar />
        </aside>
        <section className="col-span-12 md:col-span-6">
          {children}
        </section>
        <aside className="md:hidden col-span-12 mt-8">
          <RightSidebar />
        </aside>
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-24">
            <RightSidebar />
          </div>
        </aside>
      </main>
    </div>
  );
}
