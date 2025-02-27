import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ColorCustomizer } from './ColorCustomizer';
import { cn } from '@/lib/utils';

export function ThemeCustomizer() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Customize</span>
        </Button>
      </Popover.Trigger>

      <Popover.Portal container={document.querySelector('.sidebar-panel')}>
        <Popover.Content
          className={cn(
            "z-50 w-[280px] rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2"
          )}
          side="top"
          align="center"
          sideOffset={20}
        >
          <ColorCustomizer onClose={() => {
            const trigger = document.querySelector('[data-state="open"]') as HTMLButtonElement;
            trigger?.click();
          }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
} 