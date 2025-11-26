import { LRUCache } from 'lru-cache';

// Cache configuration
const cacheConfig = {
  max: 500, // Maximum items
  ttl: 1000 * 60 * 5, // 5 minutes default
};

// Create cache instance
const cache = new LRUCache<string, any>(cacheConfig);

// Cache utilities
export const Cache = {
  // Get cached data
  get<T>(key: string): T | undefined {
    return cache.get(key);
  },

  // Set cached data with optional TTL
  set(key: string, value: any, ttl?: number): void {
    cache.set(key, value, { ttl: ttl || cacheConfig.ttl });
  },

  // Delete cached data
  delete(key: string): void {
    cache.delete(key);
  },

  // Clear all cache
  clear(): void {
    cache.clear();
  },

  // Check if key exists
  has(key: string): boolean {
    return cache.has(key);
  },

  // Get or fetch data with caching
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const data = await fetcher();
    cache.set(key, data, { ttl: ttl || cacheConfig.ttl });
    return data;
  },
};

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userPosts: (id: string, limit?: number) => `user:${id}:posts:${limit || 'all'}`,
  post: (id: string) => `post:${id}`,
  posts: (limit?: number, authorId?: string) => 
    `posts:${limit || 'all'}:${authorId || 'all'}`,
  users: (role?: string, search?: string) => 
    `users:${role || 'all'}:${search || 'all'}`,
  postComments: (postId: string) => `post:${postId}:comments`,
  userConnections: (userId: string, type: 'followers' | 'following') => 
    `user:${userId}:${type}`,
};

// Cache TTLs (in milliseconds)
export const CacheTTL = {
  user: 1000 * 60 * 5, // 5 minutes
  post: 1000 * 60 * 2, // 2 minutes
  posts: 1000 * 60 * 1, // 1 minute
  users: 1000 * 60 * 2, // 2 minutes
  comments: 1000 * 60 * 1, // 1 minute
  connections: 1000 * 60 * 5, // 5 minutes
};

// Helper to invalidate related caches
export const invalidateCache = {
  user: (userId: string) => {
    cache.delete(CacheKeys.user(userId));
    // Invalidate user posts
    cache.forEach((_, key) => {
      if (key.startsWith(`user:${userId}:posts`)) {
        cache.delete(key);
      }
    });
  },
  
  post: (postId: string, authorId?: string) => {
    cache.delete(CacheKeys.post(postId));
    cache.delete(CacheKeys.postComments(postId));
    // Invalidate posts lists
    cache.forEach((_, key) => {
      if (key.startsWith('posts:')) {
        cache.delete(key);
      }
    });
    // Invalidate author's posts
    if (authorId) {
      cache.forEach((_, key) => {
        if (key.startsWith(`user:${authorId}:posts`)) {
          cache.delete(key);
        }
      });
    }
  },
  
  comment: (postId: string) => {
    cache.delete(CacheKeys.postComments(postId));
    cache.delete(CacheKeys.post(postId));
  },
  
  connection: (userId: string, targetId: string) => {
    cache.delete(CacheKeys.userConnections(userId, 'following'));
    cache.delete(CacheKeys.userConnections(targetId, 'followers'));
    cache.delete(CacheKeys.user(userId));
    cache.delete(CacheKeys.user(targetId));
  },
};
