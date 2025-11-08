import passport from "passport";
import { storage } from "./storage";
import type { RequestHandler } from "express";

export function setupPassport() {
  // User'ni session'ga serialize qilish
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // User'ni session'dan deserialize qilish
  // CRITICAL: We check sessionVersion to invalidate sessions when role changes
  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      // Get fresh user data from database
      const dbUser = await storage.getUser(sessionUser.id);
      
      if (!dbUser) {
        console.warn(`User not found during deserialization: ${sessionUser.id}`);
        return done(null, false);
      }
      
      // Check if session is stale (sessionVersion mismatch)
      // This happens when admin changes user's role
      const sessionVersion = sessionUser.sessionVersion ?? 0;
      const dbVersion = dbUser.sessionVersion ?? 0;
      
      if (sessionVersion !== dbVersion) {
        console.log(`Session version mismatch for user ${sessionUser.id}: session=${sessionVersion}, db=${dbVersion}. Invalidating session.`);
        return done(null, false); // This will trigger 401 and force re-login
      }
      
      // Update session user with fresh database data
      sessionUser.id = dbUser.id;
      sessionUser.email = dbUser.email;
      sessionUser.phoneNumber = dbUser.phoneNumber;
      sessionUser.firstName = dbUser.firstName;
      sessionUser.lastName = dbUser.lastName;
      sessionUser.role = dbUser.role; // IMPORTANT: Always use fresh role from database
      sessionUser.profileImageUrl = dbUser.profileImageUrl;
      
      done(null, sessionUser);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });
}

// Simple authentication middleware - no token refresh needed
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
