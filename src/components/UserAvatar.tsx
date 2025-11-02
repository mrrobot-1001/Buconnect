import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from '@prisma/client';

type Props = {
  user: Pick<User, 'name' | 'profileImage'>;
  className?: string;
};

export function UserAvatar({ user, className }: Props) {
  return (
    <Avatar className={className}>
      <AvatarImage src={user.profileImage ?? ''} alt={user.name} />
      <AvatarFallback>
        {user.name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}
