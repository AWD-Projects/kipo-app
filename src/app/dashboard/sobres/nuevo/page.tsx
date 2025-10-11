"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { toLocalDateString } from "@/lib/dateUtils";

const CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Vivienda",
  "Servicios",
  "Ropa",
  "Tecnología",
  "Viajes",
  "Otros",
];

const PERIODS = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Form state
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || !startDate) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("El monto debe ser un número positivo");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: numAmount,
          period,
          startDate: toLocalDateString(startDate),
          endDate: endDate ? toLocalDateString(endDate) : null,
          autoAdjust: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear presupuesto");
      }

      toast.success("Presupuesto creado exitosamente");
      router.push("/dashboard/sobres");
    } catch (error: any) {
      console.error("Error creating budget:", error);
      toast.error(error.message || "Error al crear presupuesto");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAISuggestion = async () => {
    if (!category) {
      toast.error("Selecciona una categoría primero");
      return;
    }

    setLoadingAI(true);

    try {
      const response = await fetch("/api/budgets/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          categories: [category],
          preferences: {
            conservative: false,
            includeReasons: true,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al obtener sugerencia");
      }

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        const suggestion = data.suggestions[0];
        setAmount(suggestion.suggestedAmount.toString());
        toast.success(`AI sugiere: ${suggestion.reasoning}`, {
          duration: 5000,
        });
      } else {
        toast.info("No hay suficientes datos para generar una sugerencia. Ingresa un monto manualmente.");
      }
    } catch (error: any) {
      console.error("Error getting AI suggestion:", error);
      toast.error(error.message || "Error al obtener sugerencia de AI");
    } finally {
      setLoadingAI(false);
    }
  };

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
          <div>
            <h1 className="kipo-page-title">Nuevo Presupuesto</h1>
            <p className="kipo-page-description">
              Crea un presupuesto para controlar tus gastos
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Presupuesto</CardTitle>
            <CardDescription>
              Completa la información para crear tu presupuesto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount with AI Suggestion */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Monto <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetAISuggestion}
                    disabled={!category || loadingAI}
                  >
                    {loadingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Haz clic en el botón con estrella para obtener una sugerencia de AI
                </p>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label htmlFor="period">
                  Período <span className="text-destructive">*</span>
                </Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Fecha de Inicio <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  value={startDate}
                  onChange={(date) => date && setStartDate(date)}
                />
              </div>

              {/* End Date (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                />
                <p className="text-xs text-muted-foreground">
                  Si no especificas una fecha de fin, el presupuesto se renovará automáticamente
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Presupuesto"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Consejo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Usa las sugerencias de AI para establecer presupuestos realistas</li>
              <li>Monitorea tu progreso en la página principal de presupuestos</li>
              <li>Puedes editar o eliminar el presupuesto en cualquier momento</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
