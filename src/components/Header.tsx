import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Building2, Home, LogOut, Search, Settings, User as UserIcon, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { mockUsers } from "@/lib/mock-data";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  // In a real app, you would get the logged-in user from a session.
  const currentUser = mockUsers.find(u => u.role !== 'ADMIN') || mockUsers[1]; // Mocking a logged-in student/alumni

  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage) {
    // A simplified header for the admin layout, or we can just return null and handle it in AdminLayout
    return (
        <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
        </div>
    );
  }

  const navItems = [
      { href: "/feed", icon: Home, label: "Home" },
      { href: "/network", icon: Users, label: "Network" },
      { href: "/messaging", icon: MessageSquare, label: "Messaging" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-primary hidden sm:inline-block">BUConnect</span>
          </Link>
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="w-full lg:w-[300px] pl-10 bg-background" />
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
           <Button variant="ghost" size="icon" className="lg:hidden">
              <Search className="h-5 w-5" />
           </Button>
           
           {navItems.map(item => (
                <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className={cn("flex flex-col h-auto px-2 py-1 space-y-1 text-muted-foreground hover:text-primary", { 'text-primary': pathname.startsWith(item.href)})}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] sm:text-xs">{item.label}</span>
                    </Button>
                </Link>
           ))}
          

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <UserAvatar user={currentUser} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href={`/profile/${currentUser.id}`}>
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
               <Link href="/">
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
