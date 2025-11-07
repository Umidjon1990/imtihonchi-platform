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
  // IMPORTANT: We merge fresh DB data (including role) with session tokens
  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      // Get fresh user data from database
      const dbUser = await storage.getUser(sessionUser.id);
      
      if (!dbUser) {
        console.warn(`User not found during deserialization: ${sessionUser.id}`);
        return done(null, false);
      }
      
      // Merge fresh DB data with existing session tokens
      // This ensures role changes are reflected immediately
      const updatedUser = {
        ...sessionUser, // Keep Replit Auth tokens (access_token, refresh_token, expires_at, claims)
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role, // IMPORTANT: Always use fresh role from database
        profileImageUrl: dbUser.profileImageUrl,
      };
      
      done(null, updatedUser);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });
}
