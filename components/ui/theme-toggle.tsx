"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("system");
  
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);
  
  const applyTheme = (t: string) => {
    const root = document.documentElement;
    if (t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", t);
  };
  
  return (
    <select
      value={theme}
      onChange={(e) => {
        setTheme(e.target.value);
        applyTheme(e.target.value);
      }}
      className="px-3 py-1 bg-surfaceDark dark:bg-surfaceLight text-textDark dark:text-textLight rounded-lg"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}