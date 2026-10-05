import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Older connection-request notifications point at a route that never existed.
export function notificationHref(link: string | null | undefined) {
  if (!link) return null;
  return link === "/connections/requests" ? "/connections" : link;
}
