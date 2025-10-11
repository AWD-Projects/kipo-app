"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AIChatDialog } from "@/components/ai-chat-dialog";

export function AIChatButton() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      {/* Positioned above mobile bottom nav (bottom-20 on mobile, bottom-6 on desktop) */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50" style={{
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom))'
      }}>
        {/* Tooltip - only show on desktop */}
        {showTooltip && (
          <div className="hidden lg:block absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg border whitespace-nowrap animate-in fade-in-0 zoom-in-95">
            Kipo Coach
            <div className="text-xs text-muted-foreground mt-0.5">
              Tu asistente financiero inteligente
            </div>
          </div>
        )}

        <Button
          onClick={() => setOpen(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          size="icon"
          className="h-12 w-12 lg:h-14 lg:w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Kipo Coach - Tu asistente financiero inteligente"
        >
          <Sparkles className="h-6 w-6 lg:h-7 lg:w-7" />
        </Button>
      </div>

      <AIChatDialog open={open} onOpenChange={setOpen} context="general" />
    </>
  );
}
