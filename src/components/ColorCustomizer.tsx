import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/services/firestore';
import { Input } from '@/components/ui/input';

interface ColorCustomizerProps {
  onClose: () => void;
}

interface ColorConfig {
  label: string;
  description: string;
  variable: string;
  value: {
    hue: number;
    saturation: number;
    lightness: number;
  };
}

export function ColorCustomizer({ onClose }: ColorCustomizerProps) {
  const { user } = useAuth();
  const [colors, setColors] = useState<ColorConfig[]>([
    { 
      label: 'Canvas',
      description: 'Main background of the workspace',
      variable: '--background',
      value: { hue: 42, saturation: 60, lightness: 90 }  // Cream
    },
    { 
      label: 'Cards & Panels',
      description: 'Node backgrounds, menus, and floating panels',
      variable: '--card',
      value: { hue: 40, saturation: 55, lightness: 93 }  // Slightly darker cream
    },
    { 
      label: 'Interactive Elements',
      description: 'Text, strings, dots, shadows, and interactive elements',
      variable: '--foreground',
      value: { hue: 35, saturation: 25, lightness: 30 }  // Brown
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL
  const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Handle hex input change
  const handleHexChange = (variable: string, hexValue: string) => {
    // Only process if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
      handleColorChange(variable, hexValue);
    }
  };

  // Update color in real-time
  const handleColorChange = (variable: string, hexValue: string) => {
    const { h, s, l } = hexToHSL(hexValue);
    const hslValue = `${h} ${s}% ${l}%`;
    const root = document.documentElement;
    
    root.style.setProperty(variable, hslValue);
    
    if (variable === '--background') {
      root.style.setProperty('--popover', hslValue);
    }
    if (variable === '--card') {
      root.style.setProperty('--secondary', hslValue);
      root.style.setProperty('--muted', hslValue);
      root.style.setProperty('--accent', hslValue);
    }
    if (variable === '--foreground') {
      root.style.setProperty('--card-foreground', hslValue);
      root.style.setProperty('--popover-foreground', hslValue);
      root.style.setProperty('--secondary-foreground', hslValue);
      root.style.setProperty('--muted-foreground', hslValue);
      root.style.setProperty('--accent-foreground', hslValue);
    }
    
    setColors(colors.map(color => 
      color.variable === variable 
        ? { ...color, value: { hue: h, saturation: s, lightness: l } }
        : color
    ));
  };

  // Save colors to Firebase
  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const colorPrefs = colors.reduce((acc, { variable, value }) => {
        const hslValue = `${value.hue} ${value.saturation}% ${value.lightness}%`;
        return {
          ...acc,
          [variable]: hslValue,
          ...(variable === '--background' ? { '--popover': hslValue } : {}),
          ...(variable === '--card' ? {
            '--secondary': hslValue,
            '--muted': hslValue,
            '--accent': hslValue
          } : {}),
          ...(variable === '--foreground' ? {
            '--card-foreground': hslValue,
            '--popover-foreground': hslValue,
            '--secondary-foreground': hslValue,
            '--muted-foreground': hslValue,
            '--accent-foreground': hslValue
          } : {})
        };
      }, {});

      await firestoreService.updateColorPreferences(user.uid, colorPrefs);
      onClose();
    } catch (error) {
      console.error('Error saving color preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-[280px] p-4">
      <h3 className="text-lg font-semibold mb-4">Theme Colors</h3>
      
      <div className="space-y-6">
        {colors.map(({ label, description, variable, value }) => {
          const hexColor = hslToHex(value.hue, value.saturation, value.lightness);
          return (
            <div key={variable} className="group">
              <div className="mb-1">
                <label className="text-sm font-medium text-foreground">
                  {label}
                </label>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {description}
              </div>
              <div 
                className="w-full h-12 rounded-md border border-muted mb-1 cursor-pointer transition-all hover:border-muted-foreground"
                style={{ background: hexColor }}
              />
              <Input
                type="text"
                value={hexColor.toUpperCase()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value.startsWith('#')) {
                    handleHexChange(variable, '#' + value);
                  } else {
                    handleHexChange(variable, value);
                  }
                }}
                className="h-8 text-xs font-mono bg-background/50"
                spellCheck={false}
              />
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
} 