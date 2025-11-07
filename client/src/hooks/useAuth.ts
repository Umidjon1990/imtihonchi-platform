import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Fetch user data from backend (Replit Auth via session)
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on component mount
    refetchOnReconnect: false,
    staleTime: 0, // Always consider data stale, refetch when needed
  });

  return {
    user,
    isLoading: isLoading && !isError, // Error bo'lsa loading false
    isAuthenticated: !!user,
  };
}
