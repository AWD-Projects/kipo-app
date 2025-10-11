"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { formatDateES } from "@/lib/dateUtils";
import { toast } from "sonner";

interface BudgetAlert {
  id: string;
  budget_id: string;
  alert_type: 'approaching' | 'exceeded' | 'predicted_overspend' | 'achievement';
  threshold_percentage: number;
  current_spent: number;
  budget_amount: number;
  ai_recommendation: string;
  triggered_at: string;
  acknowledged_at: string | null;
  dismissed_at: string | null;
}

interface BudgetAlertsPanel {
  onClose?: () => void;
}

export function BudgetAlertsPanel({ onClose }: BudgetAlertsPanel) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/budgets/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/budgets/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge' }),
      });

      if (response.ok) {
        setAlerts(alerts.map(a =>
          a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
        ));
        toast.success('Alerta marcada como leída');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Error al marcar alerta');
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(`/api/budgets/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        toast.success('Alerta eliminada');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Error al eliminar alerta');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exceeded':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'approaching':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'exceeded':
        return 'bg-red-50 border-red-200';
      case 'approaching':
        return 'bg-orange-50 border-orange-200';
      case 'achievement':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getAlertTitle = (alert: BudgetAlert) => {
    if (alert.alert_type === 'exceeded') {
      return '¡Presupuesto Excedido!';
    } else if (alert.threshold_percentage >= 90) {
      return 'Presupuesto Crítico';
    } else if (alert.threshold_percentage >= 70) {
      return 'Advertencia de Presupuesto';
    }
    return 'Notificación';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Alertas de Presupuesto</h3>
        </div>
        <p className="text-sm text-muted-foreground">Cargando alertas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-lg">Alertas de Presupuesto</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Alerts List */}
      <ScrollArea className="flex-1">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-sm font-medium">No hay alertas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tus presupuestos están bajo control
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.alert_type)} ${
                  alert.acknowledged_at ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">
                        {getAlertTitle(alert)}
                      </h4>
                      <div className="flex items-center gap-1">
                        {!alert.acknowledged_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleAcknowledge(alert.id)}
                            title="Marcar como leída"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDismiss(alert.id)}
                          title="Eliminar"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Gastado:</span>
                        <span className="font-semibold">
                          {formatCurrency(alert.current_spent)} de {formatCurrency(alert.budget_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Porcentaje:</span>
                        <span className="font-semibold">
                          {alert.threshold_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {alert.ai_recommendation && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-xs text-muted-foreground">
                          {alert.ai_recommendation}
                        </p>
                      </>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDateES(alert.triggered_at.split('T')[0])}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
