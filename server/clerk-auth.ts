import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { storage } from './storage';

// Re-export Clerk's base middleware
export { clerkMiddleware };

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

// Middleware to sync user and attach to request
export async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    
    if (auth?.userId) {
      // Sync user to database
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        await storage.upsertUser({
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileImageUrl: clerkUser.imageUrl || null,
        });
        
        // Attach to request
        req.userId = auth.userId;
        req.clerkUser = {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
        };
      } catch (error) {
        console.error('Failed to sync user:', error);
      }
    }
    
    next();
  } catch (error) {
    console.error('Attach user error:', error);
    next();
  }
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
