import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { authStorage } from "../lib/storage";
import type { AuthUser, LoginResponse } from "../types";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [user, setUser] = useState<AuthUser | null>(authStorage.getUser());

  const login = async (username: string, password: string) => {
    const result = await api.post<LoginResponse>("/login", { username, password });

    if (result.user.role !== "ADMIN") {
      throw new Error("Only ADMIN can access this web portal");
    }

    setToken(result.token);
    setUser(result.user);
    authStorage.setToken(result.token);
    authStorage.setUser(result.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    authStorage.clearToken();
    authStorage.clearUser();
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
