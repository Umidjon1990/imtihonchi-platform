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
      
      // CRITICAL: Mutate sessionUser in place to preserve token refresh updates
      // Creating a new object would lose refreshed access_token/refresh_token
      sessionUser.id = dbUser.id;
      sessionUser.email = dbUser.email;
      sessionUser.firstName = dbUser.firstName;
      sessionUser.lastName = dbUser.lastName;
      sessionUser.role = dbUser.role; // IMPORTANT: Always use fresh role from database
      sessionUser.sessionVersion = dbUser.sessionVersion; // Keep version in sync
      sessionUser.profileImageUrl = dbUser.profileImageUrl;
      
      done(null, sessionUser);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });
}
