"use client";

import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { useUser } from "@/contexts/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to login if not authenticated (after loading completes)
    if (!isLoading && !currentUser) {
      router.replace('/');
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-label="Loading" />
      </div>
    );
  }

  // Below xl the right rail has no column; on the feed it moves under the posts.
  const showRailInline = pathname === '/feed';

  return (
    <div className="min-h-[100dvh]">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-3 pt-[4.5rem] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-4 md:pt-24 md:pb-10 lg:px-6">
        <div className="grid grid-cols-12 gap-6">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              <LeftSidebar />
            </div>
          </aside>
          <section className="col-span-12 min-w-0 lg:col-span-9 xl:col-span-6">
            <div className="mx-auto w-full max-w-2xl xl:max-w-none">
              {children}
              {showRailInline && (
                <div className="mt-6 xl:hidden">
                  <RightSidebar />
                </div>
              )}
            </div>
          </section>
          <aside className="hidden xl:col-span-3 xl:block">
            <div className="sticky top-24">
              <RightSidebar />
            </div>
          </aside>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
