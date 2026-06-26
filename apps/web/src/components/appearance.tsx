import {
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@jasonruesch/react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { type ThemeMode, useThemeStore } from '~/stores/theme.store';

const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'system'];
const THEME_ICON: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};
const THEME_LABEL: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/** Topbar control: cycles light → dark → system. */
export function ThemeToggleButton() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const Icon = THEME_ICON[theme];
  const next =
    THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton
          variant="ghost"
          aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[next]}`}
          onClick={() => setTheme(next)}
        >
          <Icon size={18} aria-hidden />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent>Theme: {THEME_LABEL[theme]}</TooltipContent>
    </Tooltip>
  );
}
