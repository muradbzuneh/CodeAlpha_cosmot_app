import { createAuthClient } from "better-auth/react";

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
  updateUser,
} = authClient;
