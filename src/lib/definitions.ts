// Type definitions for Supabase schema
export type UserRole = 'STUDENT' | 'ALUMNI' | 'ADMIN';

export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  bio?: string | null;
  profile_image?: string | null;
  profileImage?: string | null; // Support both naming conventions
  course?: string | null;
  batch?: number | null;
  profession?: string | null;
  created_at?: Date | string;
  createdAt?: Date | string; // Support both naming conventions
  updated_at?: Date | string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  imageUrl?: string | null; // Support both naming conventions
  author_id: string;
  authorId?: string; // Support both naming conventions
  created_at: Date | string;
  createdAt?: Date | string; // Support both naming conventions
  updated_at?: Date | string;
};

export type PostWithAuthor = Post & {
  author: User;
  _count?: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
};

export type Comment = {
  id: string;
  text: string;
  author_id: string;
  authorId?: string; // Support both naming conventions
  post_id: string;
  postId?: string; // Support both naming conventions
  created_at: Date | string;
  createdAt?: Date | string; // Support both naming conventions
  updated_at?: Date | string;
};

export type CommentWithAuthor = Comment & {
  author: User;
};
