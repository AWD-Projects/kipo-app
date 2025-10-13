"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  PiggyBank,
  Shield,
  Plane,
  Home,
  Car,
  GraduationCap,
  Heart,
  Gift,
  Laptop,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

const GOAL_ICONS_MAP: Record<string, LucideIcon> = {
  'piggy-bank': PiggyBank,
  'shield': Shield,
  'plane': Plane,
  'home': Home,
  'car': Car,
  'graduation-cap': GraduationCap,
  'heart': Heart,
  'gift': Gift,
  'target': Target,
  'laptop': Laptop,
  'briefcase': Briefcase,
};

const CATEGORY_LABELS: Record<string, string> = {
  emergency_fund: "Fondo de Emergencia",
  retirement: "Retiro",
  education: "Educación",
  home: "Vivienda",
  vacation: "Vacaciones",
  debt_payoff: "Pago de Deudas",
  vehicle: "Vehículo",
  investment: "Inversión",
  personal_development: "Desarrollo Personal",
  other: "Otro",
};

export default function SugerenciasMetasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [creatingGoalId, setCreatingGoalId] = useState<string | null>(null);

  const loadSuggestions = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/savings-goals/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar sugerencias");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setHasLoaded(true);

      if (!data.suggestions || data.suggestions.length === 0) {
        toast.info("No se encontraron nuevas sugerencias en este momento");
      }
    } catch (error: any) {
      console.error("Error loading suggestions:", error);
      toast.error(error.message || "Error al cargar sugerencias");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: any) => {
    try {
      setCreatingGoalId(suggestion.name);

      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.name,
          description: suggestion.reasoning,
          target_amount: suggestion.target_amount,
          target_date: suggestion.suggested_timeline
            ? new Date(
                Date.now() + suggestion.suggested_timeline * 30 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split("T")[0]
            : null,
          icon: suggestion.icon || "target",
          color: suggestion.color || "#3b82f6",
          priority: suggestion.priority || 3,
          initial_contribution: 0,
          ai_suggested: true,
          ai_category: suggestion.category,
          ai_confidence: suggestion.confidence_score,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear meta");
      }

      const data = await response.json();
      toast.success("Meta creada exitosamente");

      // Remove accepted suggestion
      setSuggestions((prev) =>
        prev.filter((s) => s.name !== suggestion.name)
      );

      // Navigate to the new goal
      router.push(`/dashboard/metas/${data.goal.id}`);
    } catch (error: any) {
      console.error("Error accepting suggestion:", error);
      toast.error(error.message || "Error al crear meta");
    } finally {
      setCreatingGoalId(null);
    }
  };

  const handleRejectSuggestion = (suggestion: any) => {
    setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
    toast.success("Sugerencia descartada");
  };

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/metas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="kipo-page-title">Sugerencias AI</h1>
            <p className="kipo-page-description">
              Metas personalizadas basadas en tu situación financiera
            </p>
          </div>
        </div>

        {/* Info Card */}
        {!hasLoaded && !generating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                ¿Cómo Funciona?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Nuestro asistente AI analiza tu historial financiero, patrones
                  de gasto, ingresos y metas actuales para sugerirte objetivos de
                  ahorro personalizados.
                </p>
                <p>
                  Las sugerencias incluyen montos objetivo, plazos recomendados y
                  estrategias para alcanzar cada meta.
                </p>
              </div>
              <Button
                onClick={loadSuggestions}
                disabled={generating}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Sugerencias
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {generating && (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        )}

        {/* Empty State */}
        {hasLoaded && !generating && suggestions.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No hay sugerencias nuevas
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ya tienes metas que cubren las principales áreas recomendadas, o
                bien, necesitas más historial financiero para generar
                sugerencias.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/dashboard/metas/nuevo">
                  <Button>
                    <Target className="mr-2 h-4 w-4" />
                    Crear Meta Manual
                  </Button>
                </Link>
                <Link href="/dashboard/metas">
                  <Button variant="outline">Ver Mis Metas</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions List */}
        {hasLoaded && !generating && suggestions.length > 0 && (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => {
              const IconComponent = GOAL_ICONS_MAP[suggestion.icon] || Target;
              const category = CATEGORY_LABELS[suggestion.category] || "Otro";
              const isCreating = creatingGoalId === suggestion.name;

              return (
                <Card key={index} className="relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ backgroundColor: suggestion.color || "#3b82f6" }}
                  />

                  <CardHeader className="ml-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: suggestion.color || "#3b82f6" }}
                        >
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {suggestion.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {suggestion.reasoning}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 ml-2">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Monto Objetivo
                        </p>
                        <p className="font-semibold">
                          {formatCurrency(suggestion.target_amount)}
                        </p>
                      </div>

                      {suggestion.recommended_monthly_amount && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Ahorro Mensual
                          </p>
                          <p className="font-semibold">
                            {formatCurrency(suggestion.recommended_monthly_amount)}
                            /mes
                          </p>
                        </div>
                      )}

                      {suggestion.suggested_timeline && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Plazo Sugerido
                          </p>
                          <p className="font-semibold">
                            {suggestion.suggested_timeline}{" "}
                            {suggestion.suggested_timeline === 1
                              ? "mes"
                              : "meses"}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Prioridad
                        </p>
                        <Badge variant={
                          suggestion.priority === 1 ? "destructive" :
                          suggestion.priority === 2 ? "default" :
                          "outline"
                        }>
                          {suggestion.priority === 1 ? "Muy Alta" :
                           suggestion.priority === 2 ? "Alta" :
                           suggestion.priority === 3 ? "Media" :
                           suggestion.priority === 4 ? "Baja" :
                           "Normal"}
                        </Badge>
                      </div>
                    </div>

                    {/* AI Insights */}
                    {suggestion.insights && suggestion.insights.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Insights AI
                        </p>
                        <ul className="space-y-1">
                          {suggestion.insights.slice(0, 3).map(
                            (insight: string, i: number) => (
                              <li
                                key={i}
                                className="text-xs text-muted-foreground"
                              >
                                • {insight}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Confidence Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{
                            width: `${(suggestion.confidence_score || 0) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {((suggestion.confidence_score || 0) * 100).toFixed(0)}%
                        confianza
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        disabled={isCreating}
                        className="flex-1"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aceptar y Crear Meta
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRejectSuggestion(suggestion)}
                        variant="outline"
                        disabled={isCreating}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Descartar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        {hasLoaded && suggestions.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={loadSuggestions}
              disabled={generating}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar Sugerencias
            </Button>
          </div>
        )}

        {/* Footer Info */}
        {hasLoaded && suggestions.length > 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                <p>
                  Las sugerencias se actualizan automáticamente según tu
                  progreso financiero
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
