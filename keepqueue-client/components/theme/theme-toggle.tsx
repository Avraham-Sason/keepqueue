"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const { t } = useLanguage();

    return (
        <Button title={t("toggleTheme")} variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <Sun className="h-4 w-4 rotate-0 scale-0 transition-all dark:-rotate-0 dark:scale-100" />
            <Moon className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
        </Button>
    );
}
