import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="size-3.5 sm:size-4 p-0 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <SunIcon className="size-3.5 sm:size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute size-3.5 sm:size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ThemeToggle };
