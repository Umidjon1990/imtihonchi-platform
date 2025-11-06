import type { Request } from "express";

/**
 * Get user ID from request - supports both Firebase Phone Auth and Replit Auth
 */
export function getUserId(req: Request): string {
  const user = req.user as any;
  
  // Firebase Phone Auth: user.id
  if (user?.id) {
    return user.id;
  }
  
  // Replit Auth: user.claims.sub
  if (user?.claims?.sub) {
    return user.claims.sub;
  }
  
  throw new Error("User ID not found");
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(req: Request): boolean {
  return req.isAuthenticated();
}
