import { useEffect } from "react";
import { Button } from "../../../components/button/Button";
import { Tooltip } from "../../../components/ui/Tooltip";
import { usePlayground } from "../../../stores/playground";

export function ThemeToggle() {
  const theme = usePlayground((s) => s.theme);
  const toggleTheme = usePlayground((s) => s.toggleTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <Tooltip label="Tema">
      <Button data-feature="theme-toggle" aria-label="Alternar tema" onClick={toggleTheme}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9L13 13M3 13l1.1-1.1M11.9 4.1L13 3" />
        </svg>
      </Button>
    </Tooltip>
  );
}
