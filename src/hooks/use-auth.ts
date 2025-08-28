import { useAuth as useAuthContext } from "@/providers/auth-provider"

/**
 * Custom hook that provides easy access to authentication state and methods.
 * This hook wraps the AuthContext and provides a clean API for components.
 * 
 * @returns {Object} Authentication state and methods
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  return useAuthContext()
}