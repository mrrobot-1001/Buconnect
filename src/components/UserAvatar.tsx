import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  user: { 
    name: string; 
    profileImage?: string | null; 
    profile_image?: string | null;
    profileImageUrl?: string | null;
  };
  className?: string;
};

export function UserAvatar({ user, className }: Props) {
  // Try different property names for profile image
  const avatarUrl = user.profileImage || user.profile_image || user.profileImageUrl || '';
  
  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm">
        {user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
