import * as React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Paintbrush, Palette } from "lucide-react";
import { themeOptions, useTheme, ThemeAppearance, ThemeVariant } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const Icon = theme.appearance === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Icon className="h-4 w-4" />
          <span className="sr-only">Changer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Apparence</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeOptions.appearance.map((appearance) => (
          <DropdownMenuItem 
            key={appearance.value}
            onClick={() => setTheme({ 
              ...theme, 
              appearance: appearance.value as ThemeAppearance
            })}
          >
            {appearance.value === "light" && <Sun className="mr-2 h-4 w-4" />}
            {appearance.value === "dark" && <Moon className="mr-2 h-4 w-4" />}
            {appearance.value === "system" && <Palette className="mr-2 h-4 w-4" />}
            {appearance.name}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            <span>Couleurs</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={theme.primary}
              onValueChange={(value) => setTheme({ ...theme, primary: value })}
            >
              {themeOptions.primary.map((color) => (
                <DropdownMenuRadioItem key={color.value} value={color.value}>
                  <div className="flex items-center">
                    <div 
                      className="mr-2 h-4 w-4 rounded-full" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Style</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={theme.variant}
              onValueChange={(value) => 
                setTheme({ ...theme, variant: value as ThemeVariant })
              }
            >
              {themeOptions.variant.map((variant) => (
                <DropdownMenuRadioItem key={variant.value} value={variant.value}>
                  {variant.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Coins arrondis</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={theme.radius.toString()}
              onValueChange={(value) => 
                setTheme({ ...theme, radius: parseFloat(value) })
              }
            >
              {themeOptions.radius.map((radius) => (
                <DropdownMenuRadioItem key={radius.value} value={radius.value.toString()}>
                  {radius.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}