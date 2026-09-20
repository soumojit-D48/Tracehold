"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem("tracehold-theme");
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => theme === "system" && applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  function select(next: Theme) {
    setTheme(next);
    window.localStorage.setItem("tracehold-theme", next);
    applyTheme(next);
  }

  return (
    <div className="flex items-center gap-1 rounded-xl bg-secondary p-1" aria-label="Color theme">
      {(["light", "dark", "system"] as Theme[]).map((item) => {
        const Icon = item === "light" ? Sun : item === "dark" ? Moon : Monitor;
        return <button key={item} type="button" onClick={() => select(item)} aria-label={`Use ${item} theme`} aria-pressed={theme === item} className={`grid size-8 place-items-center rounded-lg transition ${theme === item ? "bg-card text-foreground shadow-clay-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon size={14} /></button>;
      })}
    </div>
  );
}
