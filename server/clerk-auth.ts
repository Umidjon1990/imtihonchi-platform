import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware as baseClerkMiddleware, getAuth, requireAuth as baseRequireAuth, clerkClient } from '@clerk/express';
import { storage } from './storage';

export interface ClerkUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clerkUser?: ClerkUser;
    }
  }
}

// Sync Clerk user to database
async function syncUserToDatabase(userId: string) {
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    await storage.upsertUser({
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      profileImageUrl: clerkUser.imageUrl || null,
    });
  } catch (error) {
    console.error('Failed to sync user to database:', error);
  }
}

// Custom middleware that uses Clerk's clerkMiddleware and adds req.userId
export async function clerkMiddleware(req: Request, res: Response, next: NextFunction) {
  // First, run Clerk's base middleware
  baseClerkMiddleware()(req, res, async () => {
    try {
      // Get auth state from request
      const auth = getAuth(req);
      
      if (auth?.userId) {
        // Sync user to database
        await syncUserToDatabase(auth.userId);
        
        // Attach userId to request for compatibility
        req.userId = auth.userId;
        
        // Get and attach full user info
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        req.clerkUser = {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
        };
      }
      
      next();
    } catch (error) {
      console.error('Clerk middleware error:', error);
      next(); // Continue without user on error
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  
  if (!auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  next();
}

// Middleware to require specific role
export function requireRole(role: 'admin' | 'teacher' | 'student') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Get user metadata from Clerk
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const userRole = clerkUser.publicMetadata?.role as string;

      if (!userRole) {
        return res.status(403).json({ message: 'Role not set. Please contact admin.' });
      }

      if (userRole !== role && userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}
