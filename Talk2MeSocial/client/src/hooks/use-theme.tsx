import * as React from "react";

// Types pour les thèmes
export type ThemeVariant = 'professional' | 'tint' | 'vibrant';
export type ThemeAppearance = 'light' | 'dark' | 'system';

export interface Theme {
  variant: ThemeVariant;
  primary: string;
  appearance: ThemeAppearance;
  radius: number;
}

// Options de thèmes prédéfinies avec typage strict
export const themeOptions = {
  primary: [
    { name: "Bleu", value: "hsl(214, 100%, 50%)" },
    { name: "Vert", value: "hsl(142, 72%, 29%)" },
    { name: "Violet", value: "hsl(262, 83%, 58%)" },
    { name: "Rose", value: "hsl(346, 100%, 58%)" },
    { name: "Orange", value: "hsl(24, 100%, 50%)" },
  ],
  variant: [
    { name: "Professionnel", value: "professional" as ThemeVariant },
    { name: "Léger", value: "tint" as ThemeVariant },
    { name: "Vibrant", value: "vibrant" as ThemeVariant },
  ],
  appearance: [
    { name: "Clair", value: "light" as ThemeAppearance },
    { name: "Sombre", value: "dark" as ThemeAppearance },
    { name: "Système", value: "system" as ThemeAppearance },
  ],
  radius: [
    { name: "Aucun", value: 0 },
    { name: "Petit", value: 0.3 },
    { name: "Moyen", value: 0.5 },
    { name: "Grand", value: 0.75 },
    { name: "Complet", value: 1 },
  ],
};

// Type pour le contexte du thème
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Créer le contexte
const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Charge le thème depuis le localStorage ou utilise la valeur par défaut
const loadTheme = (): Theme => {
  if (typeof window === "undefined") {
    return {
      variant: "professional",
      primary: "hsl(214, 100%, 50%)",
      appearance: "light",
      radius: 0.5,
    };
  }

  const savedTheme = localStorage.getItem("theme");
  return savedTheme
    ? JSON.parse(savedTheme)
    : {
        variant: "professional",
        primary: "hsl(214, 100%, 50%)",
        appearance: "light",
        radius: 0.5,
      };
};

// Applique le thème au fichier theme.json
const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme.appearance);
  const root = document.documentElement;

  // Stocker le thème dans localStorage
  localStorage.setItem("theme", JSON.stringify(theme));

  // Applique le thème dynamiquement via CSS variables
  root.style.setProperty("--theme-primary", theme.primary);
  root.style.setProperty("--theme-radius", `${theme.radius}rem`);
  
  // Appliquer le mode sombre/clair
  if (theme.appearance === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Provider pour le contexte du thème
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(loadTheme());

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, []);

  // Appliquer le thème initial
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook pour utiliser le contexte du thème
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}