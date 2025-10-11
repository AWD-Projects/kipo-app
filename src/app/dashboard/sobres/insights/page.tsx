"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Trophy,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Insight {
  id?: string;
  type: "pattern" | "opportunity" | "warning" | "achievement";
  title: string;
  description: string;
  actionable: boolean;
  impact: string;
  potentialSavings: number;
  recommendations: Array<{
    action: string;
    impact: number;
    difficulty: "easy" | "medium" | "hard";
  }>;
  createdAt: string;
  viewed?: boolean;
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async (forceGenerate = false) => {
    try {
      setLoading(true);
      const url = `/api/budgets/insights${forceGenerate ? '?generate=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cargar insights");
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error: any) {
      console.error("Error loading insights:", error);
      toast.error(error.message || "Error al cargar insights");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleGenerateNew = async () => {
    setGenerating(true);
    await loadInsights(true);
    toast.success("Nuevos insights generados");
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="h-5 w-5 text-green-600" />;
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "pattern":
      default:
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "bg-green-100 text-green-800";
      case "opportunity":
        return "bg-yellow-100 text-yellow-800";
      case "warning":
        return "bg-orange-100 text-orange-800";
      case "pattern":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getInsightBadgeText = (type: string) => {
    switch (type) {
      case "achievement":
        return "Logro";
      case "opportunity":
        return "Oportunidad";
      case "warning":
        return "Advertencia";
      case "pattern":
      default:
        return "Patrón";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
      default:
        return "text-red-600";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Fácil";
      case "medium":
        return "Medio";
      case "hard":
      default:
        return "Difícil";
    }
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sobres">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="kipo-page-title">Análisis Inteligente</h1>
            <p className="kipo-page-description">
              Descubre patrones y oportunidades en tus finanzas
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerateNew}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </>
            )}
          </Button>
        </div>

        {/* Insights List */}
        {insights.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>No hay insights disponibles</CardTitle>
              <CardDescription>
                Necesitas más transacciones para generar análisis inteligentes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Link href="/dashboard/transactions">
                <Button>Agregar Transacciones</Button>
              </Link>
              <Button variant="outline" onClick={handleGenerateNew}>
                Generar Insights
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Card key={insight.id || index} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <Badge className={getInsightBadgeColor(insight.type)}>
                            {getInsightBadgeText(insight.type)}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                    {insight.potentialSavings > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Ahorro potencial</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(insight.potentialSavings)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recomendaciones:
                      </p>
                      {insight.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-muted/50 rounded-lg p-3 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">{rec.action}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={getDifficultyColor(rec.difficulty)}>
                                Dificultad: {getDifficultyText(rec.difficulty)}
                              </span>
                            </div>
                          </div>
                          {rec.impact > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Impacto</p>
                              <p className="text-sm font-bold text-green-600">
                                {formatCurrency(rec.impact)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Help Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5" />
              Acerca de los Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Los insights son generados por inteligencia artificial analizando tus patrones de gasto
              de los últimos 30 días.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Patrones:</strong> Tendencias en tu comportamiento financiero</li>
              <li><strong>Oportunidades:</strong> Áreas donde puedes ahorrar dinero</li>
              <li><strong>Advertencias:</strong> Gastos inusuales o preocupantes</li>
              <li><strong>Logros:</strong> Objetivos cumplidos y buenas prácticas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
