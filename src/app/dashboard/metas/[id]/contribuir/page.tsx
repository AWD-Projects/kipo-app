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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Target,
  Sparkles,
  Loader2,
  Trophy,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { toLocalDateString, parseLocalDate } from "@/lib/dateUtils";

const GOAL_ICONS_MAP: Record<string, string> = {
  'piggy-bank': '🐷',
  'shield': '🛡️',
  'plane': '✈️',
  'home': '🏠',
  'car': '🚗',
  'graduation-cap': '🎓',
  'ring': '💍',
  'briefcase': '💼',
  'heart': '❤️',
  'gift': '🎁',
  'target': '🎯',
  'laptop': '💻',
};

export default function ContribuirMetaPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goalData, setGoalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    notes: "",
    contribution_date: new Date() as Date | undefined,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/savings-goals/${goalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formData.amount,
          notes: formData.notes || null,
          contribution_date: formData.contribution_date ? toLocalDateString(formData.contribution_date) : toLocalDateString(new Date()),
          source_type: "manual",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agregar contribución");
      }

      const data = await response.json();

      // Show success message
      toast.success("Contribución agregada exitosamente");

      // Show milestone achievement
      if (data.milestones_achieved && data.milestones_achieved.length > 0) {
        data.milestones_achieved.forEach((milestone: any) => {
          toast.success(
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>¡Hito Logrado: {milestone.name}!</span>
            </div>,
            {
              description: `Alcanzaste ${milestone.target_percentage}% de tu meta`,
              duration: 6000,
            }
          );
        });
      }

      // Redirect to goal detail page
      setTimeout(() => {
        router.push(`/dashboard/metas/${goalId}`);
      }, 1000);
    } catch (error: any) {
      console.error("Error adding contribution:", error);
      toast.error(error.message || "Error al agregar contribución");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!goalData?.goal) {
    return null;
  }

  const { goal, progress_percentage } = goalData;
  const progressPercentage = progress_percentage || 0;
  const remainingAmount = goal.target_amount - goal.current_amount;
  const isCompleted = goal.status === "completed";

  // Get next milestone
  const nextMilestone = goalData.milestones?.find(
    (m: any) => !m.achieved
  );

  // Calculate quick amounts (10%, 25%, 50% of remaining)
  const quickAmounts = [
    Math.round(remainingAmount * 0.1),
    Math.round(remainingAmount * 0.25),
    Math.round(remainingAmount * 0.5),
  ].filter((amount) => amount > 0);

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/metas/${goalId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="kipo-page-title">Contribuir a {goal.name}</h1>
            <p className="kipo-page-description">
              Agrega fondos para acercarte a tu meta
            </p>
          </div>
        </div>

        {isCompleted ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-medium text-green-900">
                Esta meta ya está completada
              </p>
              <p className="text-sm text-green-700 mt-2">
                ¡Felicidades por alcanzar tu objetivo!
              </p>
              <Link href={`/dashboard/metas/${goalId}`}>
                <Button variant="outline" className="mt-4">
                  Ver Detalles
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(goal.current_amount)}
                    </span>
                    <span className="text-muted-foreground">
                      de {formatCurrency(goal.target_amount)}
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div
                      className="h-3 rounded-full transition-all"
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
                    <span className="text-muted-foreground">
                      Faltan {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Next Milestone */}
                {nextMilestone && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Próximo Hito</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>{nextMilestone.name}</strong> -{" "}
                      {formatCurrency(
                        nextMilestone.target_amount - goal.current_amount
                      )}{" "}
                      restantes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contribution Form */}
            <form onSubmit={handleSubmit} className="kipo-stack">
              <Card>
                <CardHeader>
                  <CardTitle>Nueva Contribución</CardTitle>
                  <CardDescription>
                    Agrega un monto para avanzar hacia tu meta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Monto <span className="text-red-500">*</span>
                    </Label>
                    <CurrencyInput
                      id="amount"
                      value={formData.amount}
                      onValueChange={(value) =>
                        setFormData({ ...formData, amount: value })
                      }
                      placeholder="500.00"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  {quickAmounts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Montos rápidos
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        {quickAmounts.map((amount, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                amount: amount,
                              })
                            }
                            className="text-xs"
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              amount: remainingAmount,
                            })
                          }
                          className="text-xs"
                        >
                          Completar ({formatCurrency(remainingAmount)})
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="contribution_date">Fecha</Label>
                    <DatePicker
                      value={formData.contribution_date}
                      onChange={(date) =>
                        setFormData({ ...formData, contribution_date: date })
                      }
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Ej: Bono mensual, venta de artículos, ahorro semanal..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Prediction Preview */}
              {goalData.latest_prediction && formData.amount && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Impacto de tu Contribución
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nuevo progreso
                      </p>
                      <p className="font-semibold">
                        {(
                          ((goal.current_amount + (formData.amount || 0)) /
                            goal.target_amount) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Restante después de esta contribución
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(
                          Math.max(
                            0,
                            goal.target_amount -
                              goal.current_amount -
                              (formData.amount || 0)
                          )
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link href={`/dashboard/metas/${goalId}`} className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Contribución
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
