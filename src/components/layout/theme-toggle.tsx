import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="flex items-center justify-center gap-1">
      <Button size="sm" variant="outline" onClick={() => setTheme("light")}>
        白色
      </Button>
      <Button size="sm" variant="outline" onClick={() => setTheme("dark")}>
        黑色
      </Button>
      <Button size="sm" variant="outline" onClick={() => setTheme("system")}>
        系统
      </Button>
    </div>
  );
}
