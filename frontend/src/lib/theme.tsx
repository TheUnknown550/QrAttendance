import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeMode = Theme | "system";

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const STORAGE_KEY = "eventqr-theme";
const LIGHT_MARK = "/eventqr-mark-light.svg";
const DARK_MARK = "/eventqr-mark-dark.svg";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
    return storedTheme;
  }

  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  const theme = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, mode);

    const faviconHref = theme === "dark" ? DARK_MARK : LIGHT_MARK;
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');

    if (favicon) {
      favicon.href = faviconHref;
    }

    if (appleTouchIcon) {
      appleTouchIcon.href = faviconHref;
    }
  }, [mode, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      toggleTheme: () =>
        setMode((currentMode) =>
          currentMode === "system" ? "light" : currentMode === "light" ? "dark" : "system",
        ),
      setTheme: setMode,
    }),
    [mode, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
