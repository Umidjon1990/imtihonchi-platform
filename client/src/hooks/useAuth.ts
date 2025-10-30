import { useUser } from '@clerk/clerk-react';
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();

  // Fetch our app's user data (with role) from backend
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isSignedIn && isLoaded,
    retry: false,
  });

  return {
    user,
    isLoading: !isLoaded || isUserLoading,
    isAuthenticated: isSignedIn && !!user,
    clerkUser,
  };
}
