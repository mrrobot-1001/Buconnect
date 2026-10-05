"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, LogOut, User as UserIcon, Users, MessageSquare, Shield, Bookmark, UserPlus } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { NotificationBell } from "./NotificationBell";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/lib/auth/client";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/network", icon: Users, label: "Network" },
  { href: "/connections", icon: UserPlus, label: "Connections" },
  { href: "/messaging", icon: MessageSquare, label: "Messages" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useUser();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 md:h-16 lg:px-6">
        <Link href="/feed" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <svg width="32" height="32" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 shrink-0" aria-hidden="true">
              <g transform="translate(0,1000) scale(0.1,-0.1)" fill="currentColor">
                <path d="M6055 7929 c-165 -94 -304 -174 -308 -179 -5 -4 151 -287 347 -629 370 -649 413 -734 455 -917 72 -311 39 -640 -93 -928 -102 -221 -280 -435 -476 -568 -41 -28 -79 -55 -84 -59 -4 -4 69 -139 164 -299 94 -160 174 -298 177 -306 5 -12 -47 -14 -363 -14 l-369 1 2 -64 c5 -143 83 -309 202 -428 135 -134 267 -194 465 -209 67 -5 402 -10 746 -11 l625 -3 3 352 2 352 -147 1 c-82 1 -372 5 -646 8 l-497 6 82 54 c500 331 823 830 935 1446 25 141 25 547 0 685 -42 226 -104 417 -196 599 -40 80 -647 1151 -710 1253 l-16 27 -300 -170z" />
                <path d="M4831 7230 c-161 -93 -298 -173 -304 -179 -7 -7 46 -108 168 -323 373 -653 827 -1443 836 -1452 21 -23 172 112 237 212 89 138 133 318 114 467 -6 46 -21 115 -34 152 -14 42 -156 303 -367 673 -189 333 -346 608 -350 611 -3 4 -138 -69 -300 -161z" />
                <path d="M3856 6180 c-409 -47 -822 -222 -1131 -482 -191 -159 -341 -337 -482 -568 -125 -206 -662 -1116 -667 -1131 -4 -10 79 -64 291 -189 164 -96 302 -176 308 -177 5 -2 170 268 365 598 195 330 383 638 417 683 81 108 219 239 334 316 243 162 510 243 804 243 226 0 436 -48 624 -143 46 -23 84 -40 86 -38 2 2 330 571 351 609 5 9 -162 94 -274 139 -128 50 -282 94 -427 121 -126 24 -464 34 -599 19z" />
                <path d="M3935 4755 c-178 -39 -330 -138 -430 -280 -46 -66 -715 -1190 -715 -1203 0 -9 599 -367 604 -361 4 5 631 1064 751 1269 44 74 126 213 182 309 57 96 103 179 103 183 0 16 -123 66 -203 82 -91 19 -209 19 -292 1z" />
                <path d="M4075 3958 c17 -233 51 -414 109 -586 256 -760 905 -1309 1701 -1438 104 -16 718 -32 1363 -33 l292 -1 0 355 c0 195 -3 355 -7 356 -5 0 -341 4 -748 9 -685 7 -747 10 -836 28 -443 93 -793 357 -1004 754 -86 163 -155 421 -155 579 l0 59 -361 0 -360 0 6 -82z" />
              </g>
            </svg>
          <span className="text-lg font-semibold tracking-tight text-gray-900">BUConnect</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 lg:gap-2">
          {/* Phones use the bottom tab bar instead */}
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "hidden h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors md:flex",
                  active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5 lg:h-4 lg:w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-gray-100" aria-label="Account menu">
                <UserAvatar user={currentUser} className="h-9 w-9" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 rounded-xl border border-gray-200 shadow-lg" align="end">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-sm font-semibold text-gray-900">{currentUser.name}</p>
                  <p className="truncate text-xs font-normal text-gray-500">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                  <Link href={`/profile/${currentUser.id}`}>
                    <UserIcon className="mr-2 h-4 w-4 text-gray-600" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                  <Link href="/saved">
                    <Bookmark className="mr-2 h-4 w-4 text-gray-600" />
                    Saved posts
                  </Link>
                </DropdownMenuItem>
                {currentUser.role === 'ADMIN' && (
                  <DropdownMenuItem asChild className="cursor-pointer py-2.5">
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4 text-gray-600" />
                      Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
