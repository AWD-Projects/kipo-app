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
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  MessageSquare,
  DollarSign,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useUser } from "@/hooks/useUser";

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "on_track" | "warning" | "critical" | "exceeded";
  daysRemaining: number | null;
  aiSuggested: boolean;
  autoAdjust: boolean;
  aiPrediction?: {
    likelyToExceed: boolean;
    predictedOverage: number;
    recommendation: string;
  };
}

export default function PresupuestosPage() {
  const { user, supabase } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadBudgets();
    }
  }, [user?.id]);

  const loadBudgets = async () => {
    try {
      const response = await fetch('/api/budgets/current?predictions=true');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'on_track':
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-orange-100 text-orange-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_track':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'Excedido';
      case 'critical':
        return 'Crítico';
      case 'warning':
        return 'Advertencia';
      case 'on_track':
      default:
        return 'En camino';
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <div className="kipo-grid-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <div className="kipo-grid-2">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
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
            <h1 className="kipo-page-title">Sobres</h1>
            <p className="kipo-page-description">
              Gestiona tus sobres de gasto con inteligencia artificial
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/sobres/sugerencias">
              <Button variant="outline">
                <Sparkles className="kipo-icon-sm mr-2" />
                Sugerencias AI
              </Button>
            </Link>
            <Link href="/dashboard/sobres/nuevo">
              <Button>
                <Plus className="kipo-icon-sm mr-2" />
                Nuevo Sobre
              </Button>
            </Link>
          </div>
        </div>

        {/* Overall Stats */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total en Sobres
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalBudget)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Gastado
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalSpent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallPercentage.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Disponible
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalRemaining)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budgets List */}
        {budgets.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>¡Crea tu primer sobre!</CardTitle>
              <CardDescription>
                Los sobres te ayudan a controlar tus gastos por categoría y alcanzar tus metas financieras
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Link href="/dashboard/sobres/nuevo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Sobre
                </Button>
              </Link>
              <Link href="/dashboard/sobres/sugerencias">
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Obtener Sugerencias AI
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="kipo-stack-md">
            <h2 className="text-lg font-semibold">Sobres Activos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {budgets.map((budget) => (
                <Card key={budget.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(budget.status)}
                        <div>
                          <CardTitle className="text-base">{budget.category}</CardTitle>
                          {budget.aiSuggested && (
                            <Badge variant="outline" className="mt-1">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Sugerido
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(budget.status)}>
                        {getStatusText(budget.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.spent)} de {formatCurrency(budget.amount)}
                        </span>
                        <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${budget.status === 'exceeded'
                              ? 'bg-red-600'
                              : budget.status === 'critical'
                                ? 'bg-orange-600'
                                : budget.status === 'warning'
                                  ? 'bg-yellow-600'
                                  : 'bg-green-600'
                            }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Disponible</p>
                        <p className={`font-medium ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budget.remaining)}
                        </p>
                      </div>
                      {budget.daysRemaining !== null && (
                        <div>
                          <p className="text-muted-foreground">Días restantes</p>
                          <p className="font-medium">{budget.daysRemaining}</p>
                        </div>
                      )}
                    </div>

                    {/* AI Prediction */}
                    {budget.aiPrediction && budget.aiPrediction.likelyToExceed && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-orange-900">Predicción AI</p>
                            <p className="text-orange-700 mt-1">
                              {budget.aiPrediction.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/sobres/${budget.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Detalles
                        </Button>
                      </Link>
                      <Link href={`/dashboard/sobres/${budget.id}/editar`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Editar
                        </Button>
                      </Link>
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
