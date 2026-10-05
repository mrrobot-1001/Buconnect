import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  user: { 
    name: string; 
    profileImage?: string | null; 
    profile_image?: string | null;
    profileImageUrl?: string | null;
  };
  className?: string;
  fallbackClassName?: string;
};

export function UserAvatar({ user, className, fallbackClassName }: Props) {
  // Try different property names for profile image
  const avatarUrl = user.profileImage || user.profile_image || user.profileImageUrl || '';
  
  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
      <AvatarFallback className={cn("bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-sm", fallbackClassName)}>
        {user.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
