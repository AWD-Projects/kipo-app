"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { parseLocalDate } from "@/lib/dateUtils";

interface Goal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  progress_percentage: number;
  target_date?: string;
  icon: string;
  color: string;
  status: string;
  priority: number;
  ai_suggested: boolean;
  ai_category?: string;
  active_rules_count: number;
  milestones: Array<{
    name: string;
    target_amount: number;
    target_percentage: number;
    achieved: boolean;
    achieved_at?: string;
  }>;
  latest_prediction?: {
    predicted_completion_date: string;
    confidence_score: number;
    recommended_monthly_amount: number;
  };
}

export default function MetasPage() {
  const { user } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_target: 0,
    total_current: 0,
    overall_progress: 0,
    active_count: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadGoals();
    }
  }, [user?.id]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/savings-goals?include_predictions=true');

      if (!response.ok) {
        throw new Error('Error al cargar metas');
      }

      const data = await response.json();
      setGoals(data.goals || []);

      // Calculate summary
      const activeGoals = (data.goals || []).filter((g: Goal) => g.status === 'active');
      const totalTarget = activeGoals.reduce((sum: number, g: Goal) => sum + g.target_amount, 0);
      const totalCurrent = activeGoals.reduce((sum: number, g: Goal) => sum + g.current_amount, 0);
      const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

      setSummary({
        total_target: totalTarget,
        total_current: totalCurrent,
        overall_progress: overallProgress,
        active_count: activeGoals.length,
      });
    } catch (error: any) {
      console.error('Error loading goals:', error);
      toast.error('Error al cargar metas de ahorro');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'Activa', className: 'bg-green-100 text-green-800' },
      paused: { label: 'Pausada', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completada', className: 'bg-blue-100 text-blue-800' },
      abandoned: { label: 'Abandonada', className: 'bg-gray-100 text-gray-800' },
    };

    const variant = variants[status] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    const variants: Record<number, { label: string; variant: "destructive" | "default" | "outline" }> = {
      1: { label: "Muy Alta", variant: "destructive" },
      2: { label: "Alta", variant: "default" },
      3: { label: "Media", variant: "outline" },
      4: { label: "Baja", variant: "outline" },
      5: { label: "Normal", variant: "outline" },
    };

    const config = variants[priority] || variants[5];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Page Header */}
        <div className="kipo-section-header">
          <div>
            <h1 className="kipo-page-title">Metas de Ahorro</h1>
            <p className="kipo-page-description">
              Alcanza tus objetivos financieros con ayuda de IA
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/metas/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Meta
              </Button>
            </Link>
            {/* Temporarily hidden - AI suggestions feature under improvement */}
            {/* <Link href="/dashboard/metas/sugerencias">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Sugerencias AI
              </Button>
            </Link> */}
          </div>
        </div>

        {/* Summary Cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas Activas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.active_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Objetivo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total_target)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ahorrado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.total_current)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.overall_progress.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.overall_progress.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>¡Crea tu primera meta de ahorro!</CardTitle>
              <CardDescription>
                Las metas de ahorro te ayudan a alcanzar tus objetivos financieros con planificación inteligente
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Link href="/dashboard/metas/nuevo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Meta
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="kipo-stack">
            <h2 className="text-lg font-semibold">Tus Metas</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} className="relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: goal.color }}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{goal.name}</CardTitle>
                        </div>
                        {goal.description && (
                          <CardDescription className="text-xs">
                            {goal.description}
                          </CardDescription>
                        )}
                        <div className="flex gap-2 mt-2">
                          {getStatusBadge(goal.status)}
                          {getPriorityBadge(goal.priority)}
                          {goal.ai_suggested && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                        </span>
                        <span className="font-medium">{goal.progress_percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(goal.progress_percentage, 100)}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {goal.target_date && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Fecha meta
                          </p>
                          <p className="font-medium">
                            {parseLocalDate(goal.target_date).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      )}
                      {goal.latest_prediction && (
                        <div>
                          <p className="text-muted-foreground">Predicción AI</p>
                          <p className="font-medium text-xs">
                            {parseLocalDate(goal.latest_prediction.predicted_completion_date).toLocaleDateString('es-MX')}
                            <span className="text-muted-foreground ml-1">
                              ({Math.round(goal.latest_prediction.confidence_score * 100)}%)
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Next Milestone */}
                    {goal.milestones.find(m => !m.achieved) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-blue-900">
                          Próximo Hito: {goal.milestones.find(m => !m.achieved)?.name}
                        </p>
                        <p className="text-blue-700 text-xs mt-1">
                          Faltan {formatCurrency(
                            (goal.milestones.find(m => !m.achieved)?.target_amount || 0) - goal.current_amount
                          )}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/metas/${goal.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Detalles
                        </Button>
                      </Link>
                      {goal.status !== 'completed' && (
                        <Link href={`/dashboard/metas/${goal.id}/contribuir`} className="flex-1">
                          <Button size="sm" className="w-full">
                            Contribuir
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
