import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
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
async function syncUserToDatabase(clerkUser: any) {
  try {
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

// Middleware to verify Clerk session and attach user to request
export async function clerkMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get session token from Authorization header or cookie
    const sessionToken = 
      req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies?.__session;

    if (!sessionToken) {
      return next(); // No session - continue without user
    }

    // Verify session with Clerk
    const session = await clerkClient.sessions.verifySession(sessionToken, sessionToken);

    if (!session) {
      return next();
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(session.userId);

    // Sync user to database
    await syncUserToDatabase(clerkUser);

    // Attach user to request
    req.userId = clerkUser.id;
    req.clerkUser = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
    };

    next();
  } catch (error) {
    console.error('Clerk auth error:', error);
    next(); // Continue without user on error
  }
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId || !req.clerkUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Middleware to require specific role
export function requireRole(role: 'admin' | 'teacher' | 'student') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Get user metadata from Clerk
      const clerkUser = await clerkClient.users.getUser(req.userId);
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
