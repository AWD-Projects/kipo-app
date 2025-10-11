"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BudgetAlertsPanel } from "./budget-alerts-panel";
import { useUser } from "@/hooks/useUser";

export function BudgetAlertsBadge() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();

      // Poll for new alerts every 30 seconds (más frecuente para alertas inmediatas)
      const interval = setInterval(loadUnreadCount, 30 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Exponer función para refresh manual desde el exterior
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshBudgetAlerts = loadUnreadCount;
    }
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/budgets/alerts?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.alerts?.length || 0);
      }
    } catch (error) {
      console.error('Error loading unread alerts count:', error);
    }
  };

  const handleAlertsViewed = () => {
    // Refresh count when alerts panel is closed
    loadUnreadCount();
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="end"
        onInteractOutside={handleAlertsViewed}
      >
        <BudgetAlertsPanel onClose={() => {
          setIsOpen(false);
          handleAlertsViewed();
        }} />
      </PopoverContent>
    </Popover>
  );
}
