import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';

// Get Clerk publishable key from env
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

export { PUBLISHABLE_KEY };

// Re-export Clerk components and hooks
export {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  UserButton,
  useUser,
  useAuth as useClerkAuth,
  useSession,
} from '@clerk/clerk-react';
