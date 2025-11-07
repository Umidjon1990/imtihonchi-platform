import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

export function setupGoogleAuth() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
        scope: ["profile", "email"],
        proxy: true, // Trust proxy headers (for Replit)
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Google profile'dan ma'lumotlarni olish
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || "";
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const profileImageUrl = profile.photos?.[0]?.value || "";

          // Database'da user yaratish yoki yangilash
          await storage.upsertUser({
            id: googleId,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          // User obyektini qaytarish
          const user = {
            id: googleId,
            email,
            firstName,
            lastName,
            profileImageUrl,
          };

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // User'ni session'ga serialize qilish
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // User'ni session'dan deserialize qilish
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      
      // Agar user topilmasa (o'chirilgan yoki mavjud emas), session'ni bekor qilish
      if (!user) {
        console.warn(`User not found during deserialization: ${id}`);
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      // Session ma'lumoti buzilgan bo'lsa, error o'rniga false qaytarish
      done(null, false);
    }
  });
}
