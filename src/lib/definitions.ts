import type { Prisma } from '@prisma/client';

export type User = Prisma.UserGetPayload<{}>;

export type PostWithAuthor = Prisma.PostGetPayload<{
  include: {
    author: true;
    _count: {
      select: {
        likes: true;
        comments: true;
      };
    };
  };
}>;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: true;
  };
}>;
