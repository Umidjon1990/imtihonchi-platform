import passport from "passport";
import { storage } from "./storage";

export function setupPassport() {
  // User'ni session'ga serialize qilish
  // IMPORTANT: We serialize the entire user object (not just ID) to preserve
  // Replit Auth tokens (access_token, refresh_token, expires_at) required by isAuthenticated
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // User'ni session'dan deserialize qilish
  // IMPORTANT: We return the full session user object which includes Replit Auth tokens
  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      // Verify user still exists in database (handles deleted users)
      const dbUser = await storage.getUser(sessionUser.id);
      
      if (!dbUser) {
        console.warn(`User not found during deserialization: ${sessionUser.id}`);
        return done(null, false);
      }
      
      // Return the full session user with tokens intact
      done(null, sessionUser);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });
}
