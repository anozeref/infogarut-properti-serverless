import React, { createContext, useState, useEffect } from "react";

// Buat context
export const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Simpan user ke localStorage supaya tetap login setelah refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
