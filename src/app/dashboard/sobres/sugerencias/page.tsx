"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  DollarSign,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface BudgetSuggestion {
  category: string;
  suggestedAmount: number;
  confidence: number;
  reasoning: string;
  historicalData: {
    avg: number;
    min: number;
    max: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  hasExistingBudget?: boolean;
  currentBudgetAmount?: number;
}

interface AISuggestionsResponse {
  suggestions: BudgetSuggestion[];
  totalSuggested: number;
  savingsPotential: number;
  aiInsights: string;
  excludedCategories?: string[];
  existingBudgetsCount?: number;
}

export default function SugerenciasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestionsResponse | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());
  const [includeExisting, setIncludeExisting] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [includeExisting]); // Re-ejecutar cuando cambie includeExisting

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/budgets/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: "monthly",
          preferences: {
            conservative: false,
            includeReasons: true,
          },
          includeExisting,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Error al cargar sugerencias");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error: any) {
      console.error("Error loading suggestions:", error);
      toast.error(error.message || "Error al cargar sugerencias de AI");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: BudgetSuggestion) => {
    setCreating(suggestion.category);

    try {
      if (suggestion.hasExistingBudget) {
        // Update existing budget
        // First, fetch the budget ID
        const getBudgetResponse = await fetch("/api/budgets");
        if (!getBudgetResponse.ok) {
          throw new Error("Error al obtener presupuestos");
        }

        const budgetsData = await getBudgetResponse.json();
        const budgets = budgetsData.budgets || []; // La API devuelve { budgets: [...] }
        const existingBudget = budgets.find((b: any) => b.category === suggestion.category && b.is_active);

        if (!existingBudget) {
          throw new Error("No se encontró el presupuesto existente");
        }

        const updateResponse = await fetch(`/api/budgets/${existingBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: suggestion.suggestedAmount,
            autoAdjust: true,
            aiSuggested: true,
            aiConfidence: suggestion.confidence,
            aiReasoning: suggestion.reasoning,
          }),
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          toast.error(error.error || "Error al actualizar presupuesto");
          setCreating(null);
          return;
        }

        setAcceptedSuggestions(prev => new Set([...prev, suggestion.category]));
        toast.success(`Presupuesto de ${suggestion.category} actualizado exitosamente`);
      } else {
        // Create new budget
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        const response = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: suggestion.category,
            amount: suggestion.suggestedAmount,
            period: "monthly",
            startDate: startDate.toISOString().split('T')[0],
            autoAdjust: true,
            aiSuggested: true,
            aiConfidence: suggestion.confidence,
            aiReasoning: suggestion.reasoning,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || "Error al crear presupuesto");
          setCreating(null);
          return;
        }

        setAcceptedSuggestions(prev => new Set([...prev, suggestion.category]));
        toast.success(`Presupuesto de ${suggestion.category} creado exitosamente`);
      }
    } catch (error: any) {
      console.error("Error with budget:", error);
      toast.error(error.message || "Error al procesar presupuesto");
    } finally {
      setCreating(null);
    }
  };

  const handleRejectSuggestion = (category: string) => {
    setRejectedSuggestions(prev => new Set([...prev, category]));
    toast.info(`Sugerencia de ${category} rechazada`);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "Aumentando";
      case "decreasing":
        return "Disminuyendo";
      default:
        return "Estable";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.suggestions.length === 0) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/sobres">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="kipo-page-title">Sugerencias de AI</h1>
            </div>
          </div>

          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>No hay suficientes datos</CardTitle>
              <CardDescription>
                Necesitas al menos 10 transacciones en los últimos 3 meses para generar sugerencias de presupuesto
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/dashboard/transactions">
                <Button>Agregar Transacciones</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeSuggestions = suggestions.suggestions.filter(
    s => !acceptedSuggestions.has(s.category) && !rejectedSuggestions.has(s.category)
  );

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
            <h1 className="kipo-page-title">Sugerencias de AI</h1>
            <p className="kipo-page-description">
              Presupuestos inteligentes basados en tu historial de gastos
            </p>
          </div>
        </div>

        {/* Excluded Categories Info */}
        {suggestions.excludedCategories && suggestions.excludedCategories.length > 0 && !includeExisting && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {suggestions.excludedCategories.length} categoría{suggestions.excludedCategories.length > 1 ? 's' : ''} con presupuesto activo
                  </p>
                  <p className="text-xs text-blue-700">
                    {suggestions.excludedCategories.join(', ')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIncludeExisting(true)}
                  className="bg-white"
                >
                  Ver sugerencias
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights Card */}
        {suggestions.aiInsights && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Análisis General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{suggestions.aiInsights}</p>
              {suggestions.savingsPotential > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Potencial de ahorro: {formatCurrency(suggestions.savingsPotential)}/mes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Sugerido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(suggestions.totalSuggested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sugerencias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{suggestions.suggestions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Aceptadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{acceptedSuggestions.size}</p>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Grid */}
        {activeSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSuggestions.map((suggestion) => (
              <Card key={suggestion.category} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{suggestion.category}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getTrendText(suggestion.historicalData.trend)}
                        </Badge>
                        {getTrendIcon(suggestion.historicalData.trend)}
                      </div>
                    </div>
                    <div className={`text-right ${getConfidenceColor(suggestion.confidence)}`}>
                      <p className="text-xs font-medium">Confianza</p>
                      <p className="text-lg font-bold">{(suggestion.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Suggested Amount */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monto sugerido</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(suggestion.suggestedAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">mensuales</p>

                    {/* Show current budget if exists */}
                    {suggestion.hasExistingBudget && suggestion.currentBudgetAmount && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-900">
                          <strong>Presupuesto actual:</strong> {formatCurrency(suggestion.currentBudgetAmount)}
                          {suggestion.suggestedAmount < suggestion.currentBudgetAmount && (
                            <span className="text-green-600"> (Ahorra {formatCurrency(suggestion.currentBudgetAmount - suggestion.suggestedAmount)})</span>
                          )}
                          {suggestion.suggestedAmount > suggestion.currentBudgetAmount && (
                            <span className="text-orange-600"> (Aumenta {formatCurrency(suggestion.suggestedAmount - suggestion.currentBudgetAmount)})</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Historical Data */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium">Datos históricos</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Promedio</p>
                        <p className="font-medium">{formatCurrency(suggestion.historicalData.avg)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mínimo</p>
                        <p className="font-medium">{formatCurrency(suggestion.historicalData.min)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Máximo</p>
                        <p className="font-medium">{formatCurrency(suggestion.historicalData.max)}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-900 mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Razonamiento de IA
                    </p>
                    <p className="text-xs text-blue-800">{suggestion.reasoning}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      disabled={creating === suggestion.category}
                      className="flex-1"
                      variant={suggestion.hasExistingBudget ? "secondary" : "default"}
                    >
                      {creating === suggestion.category ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {suggestion.hasExistingBudget ? 'Actualizando...' : 'Creando...'}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {suggestion.hasExistingBudget ? 'Actualizar' : 'Aceptar'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectSuggestion(suggestion.category)}
                      disabled={creating === suggestion.category}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Todas las sugerencias procesadas
              </CardTitle>
              <CardDescription>
                Has revisado todas las sugerencias de AI
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Link href="/dashboard/sobres">
                <Button>Ver Presupuestos</Button>
              </Link>
              <Button variant="outline" onClick={loadSuggestions}>
                Generar Nuevas Sugerencias
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {acceptedSuggestions.size > 0 && (
          <div className="flex justify-center">
            <Link href="/dashboard/sobres">
              <Button size="lg">
                Ver Presupuestos Creados ({acceptedSuggestions.size})
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
