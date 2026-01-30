import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  // Clear auth on initial app load (start fresh from login page)
  useEffect(() => {
    const isFirstLoad = !localStorage.getItem("_appInitialized");
    if (isFirstLoad) {
      localStorage.setItem("_appInitialized", "true");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setToken("");
    }
  }, []);

  // Login handler
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  // Register handler
  const register = (userData, authToken) => {
    login(userData, authToken); // auto login after register
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken("");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = { user, token, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 👉 Custom hook that pages will import
export const useAuth = () => useContext(AuthContext);
