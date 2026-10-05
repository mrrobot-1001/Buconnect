"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, UserPlus, MessageSquare, User as UserIcon } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

// Bottom tab bar for phones; the header carries navigation from md up.
export function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useUser();
  if (!currentUser) return null;

  const items = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/network", icon: Users, label: "Network" },
    { href: "/connections", icon: UserPlus, label: "Connections" },
    { href: "/messaging", icon: MessageSquare, label: "Messages" },
    { href: `/profile/${currentUser.id}`, icon: UserIcon, label: "Profile" },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-lg pb-safe md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-blue-600" : "text-gray-500 active:text-gray-900"
                )}
              >
                <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
