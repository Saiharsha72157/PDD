// services/ThemeContext.tsx

import React, { createContext, useContext, useState } from "react";

type ThemeColorsType = {
  background: string;
  card: string;
  text: string;
  subText: string;
  border: string;
  title: string;
  primary: string;
  accent: string;
  inputBg: string;
  inputText: string;
};

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  themeColors: ThemeColorsType;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const isDark = darkMode;
  const themeColors: ThemeColorsType = {
    background: isDark ? "#121214" : "#F3F1FF",
    card: isDark ? "#1E1E24" : "#fff",
    text: isDark ? "#F3F4F6" : "#111827",
    subText: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#2E2E38" : "#F3F4F6",
    title: isDark ? "#E5E7EB" : "#111827",
    primary: "#6C3EF4",
    accent: isDark ? "#818CF8" : "#6366F1",
    inputBg: isDark ? "#24242B" : "#FFFFFF",
    inputText: isDark ? "#F3F4F6" : "#111827",
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};
