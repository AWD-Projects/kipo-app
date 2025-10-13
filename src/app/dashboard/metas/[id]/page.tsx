"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Loader2,
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
  Users,
  LucideIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { parseLocalDate } from "@/lib/dateUtils";

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
  'users': Users,
};

export default function MetaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [goalData, setGoalData] = useState<any>(null);

  useEffect(() => {
    if (goalId) {
      loadGoalDetails();
    }
  }, [goalId]);

  const loadGoalDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/savings-goals/${goalId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cargar meta");
      }

      const data = await response.json();
      setGoalData(data);
    } catch (error: any) {
      console.error("Error loading goal:", error);
      toast.error(error.message || "Error al cargar meta");
      router.push("/dashboard/metas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "¿Estás seguro de eliminar esta meta? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar meta");
      }

      toast.success("Meta eliminada exitosamente");
      router.push("/dashboard/metas");
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      toast.error(error.message || "Error al eliminar meta");
    } finally {
      setDeleting(false);
    }
  };

  const handleGeneratePrediction = async () => {
    setGeneratingPrediction(true);
    try {
      const response = await fetch(`/api/savings-goals/${goalId}/predict`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar predicción");
      }

      toast.success("Predicción generada exitosamente");

      // Reload goal details to get the new prediction
      await loadGoalDetails();
    } catch (error: any) {
      console.error("Error generating prediction:", error);
      toast.error(error.message || "Error al generar predicción");
    } finally {
      setGeneratingPrediction(false);
    }
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!goalData?.goal) {
    return null;
  }

  const { goal, progress_percentage, contributions, milestones, latest_prediction } =
    goalData;

  const progressPercentage = progress_percentage || 0;
  const remainingAmount = goal.target_amount - goal.current_amount;
  const isCompleted = goal.status === "completed";

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/metas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                {(() => {
                  const IconComponent = GOAL_ICONS_MAP[goal.icon] || Target;
                  return (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: goal.color }}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  );
                })()}
                <h1 className="kipo-page-title">{goal.name}</h1>
              </div>
              {goal.description && (
                <p className="text-muted-foreground mt-1">{goal.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!isCompleted && (
              <>
                <Link href={`/dashboard/metas/${goalId}/contribuir`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Contribuir
                  </Button>
                </Link>
                <Link href={`/dashboard/metas/${goalId}/editar`}>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCompleted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        ¡Meta Completada!
                      </p>
                      <p className="text-sm text-green-700">
                        Completada el{" "}
                        {parseLocalDate(goal.completed_at.split('T')[0]).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(goal.current_amount)}
                    </span>
                    <span className="text-muted-foreground">
                      de {formatCurrency(goal.target_amount)}
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-4 mb-2">
                    <div
                      className="h-4 rounded-full transition-all"
                      style={{
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {progressPercentage.toFixed(1)}% completado
                    </span>
                    {!isCompleted && (
                      <span className="text-muted-foreground">
                        Faltan {formatCurrency(remainingAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(goal.current_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Ahorrado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {contributions?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contribuciones
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {milestones?.filter((m: any) => m.achieved).length || 0}/
                      {milestones?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Hitos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            {milestones && milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hitos</CardTitle>
                  <CardDescription>
                    Celebra tus logros en el camino
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.map((milestone: any) => (
                      <div
                        key={milestone.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          milestone.achieved
                            ? "bg-green-50 border-green-200"
                            : "bg-muted/50"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            milestone.achieved
                              ? "bg-green-600 text-white"
                              : "bg-muted"
                          }`}
                        >
                          {milestone.achieved ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="font-bold">
                              {milestone.target_percentage}%
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(milestone.target_amount)}
                          </p>
                        </div>
                        {milestone.achieved && (
                          <Badge className="bg-green-600">Logrado</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contributions History */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Contribuciones</CardTitle>
                <CardDescription>
                  Tus aportes a esta meta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contributions && contributions.length > 0 ? (
                  <div className="space-y-3">
                    {contributions.slice(0, 10).map((contribution: any) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(contribution.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {parseLocalDate(
                              contribution.contribution_date.split('T')[0]
                            ).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {contribution.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {contribution.notes}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{contribution.source_type}</Badge>
                      </div>
                    ))}
                    {contributions.length > 10 && (
                      <p className="text-sm text-center text-muted-foreground">
                        Mostrando las últimas 10 contribuciones
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aún no hay contribuciones</p>
                    <p className="text-sm mt-1">
                      ¡Haz tu primera contribución para comenzar!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goal.target_date && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Fecha Objetivo</p>
                        <p className="text-sm text-muted-foreground">
                          {parseLocalDate(goal.target_date).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Progress */}
                    {(() => {
                      const createdDate = parseLocalDate(goal.created_at.split('T')[0]);
                      const targetDate = parseLocalDate(goal.target_date);
                      const now = new Date();

                      const totalTime = targetDate.getTime() - createdDate.getTime();
                      const elapsedTime = now.getTime() - createdDate.getTime();
                      const timeProgress = Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100);

                      const daysTotal = Math.ceil(totalTime / (1000 * 60 * 60 * 24));
                      const daysElapsed = Math.ceil(elapsedTime / (1000 * 60 * 60 * 24));
                      const daysRemaining = Math.max(0, daysTotal - daysElapsed);

                      const isPastDue = now > targetDate;

                      return (
                        <div className="pl-8 space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Inicio</span>
                            <span className={isPastDue ? "text-red-600 font-medium" : ""}>
                              {isPastDue ? "¡Vencida!" : `${daysRemaining} días restantes`}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isPastDue ? "bg-red-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${timeProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {createdDate.toLocaleDateString("es-MX", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="font-medium">
                              {timeProgress.toFixed(0)}% del tiempo transcurrido
                            </span>
                            <span>
                              {targetDate.toLocaleDateString("es-MX", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Prioridad</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        goal.priority === 1 ? "destructive" :
                        goal.priority === 2 ? "default" :
                        "outline"
                      }>
                        {goal.priority === 1 ? "Muy Alta" :
                         goal.priority === 2 ? "Alta" :
                         goal.priority === 3 ? "Media" :
                         goal.priority === 4 ? "Baja" :
                         "Normal"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Nivel {goal.priority}</span>
                    </div>
                  </div>
                </div>

                {goal.ai_suggested && (
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Sugerida por IA</p>
                      {goal.ai_confidence && (
                        <p className="text-sm text-muted-foreground">
                          Confianza: {(goal.ai_confidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Prediction Button - when no prediction exists */}
            {!latest_prediction && !isCompleted && contributions && contributions.length >= 2 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Tienes {contributions.length} contribuciones.
                    Genera una predicción AI para saber cuándo alcanzarás tu meta.
                  </p>
                  <Button
                    onClick={handleGeneratePrediction}
                    disabled={generatingPrediction}
                  >
                    {generatingPrediction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar Predicción AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* AI Prediction */}
            {latest_prediction && !isCompleted && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Predicción AI
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleGeneratePrediction}
                      disabled={generatingPrediction}
                      title="Actualizar predicción"
                    >
                      {generatingPrediction ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha Estimada
                    </p>
                    <p className="font-semibold">
                      {parseLocalDate(
                        latest_prediction.predicted_completion_date
                      ).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confianza:{" "}
                      {(latest_prediction.confidence_score * 100).toFixed(0)}%
                    </p>
                  </div>

                  {latest_prediction.recommended_monthly_amount && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ahorro Recomendado
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(
                          latest_prediction.recommended_monthly_amount
                        )}
                        /mes
                      </p>
                    </div>
                  )}

                  {latest_prediction.ai_insights &&
                    latest_prediction.ai_insights.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Insights</p>
                        <ul className="space-y-1">
                          {latest_prediction.ai_insights.slice(0, 3).map(
                            (insight: string, index: number) => (
                              <li
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                • {insight}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
