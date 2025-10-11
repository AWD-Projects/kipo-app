"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { toLocalDateString, parseLocalDate } from "@/lib/dateUtils";

const CATEGORIES = [
  "Alimentos",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Hogar",
  "Servicios",
  "Compras",
  "Otros",
];

const PERIODS = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
  { value: "custom", label: "Personalizado" },
];

export default function EditBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, supabase } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const budgetId = params?.id as string;

  // Form state
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (user?.id && budgetId) {
      loadBudget();
    }
  }, [user?.id, budgetId]);

  const loadBudget = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCategory(data.category);
        setAmount(data.amount.toString());
        setPeriod(data.period);
        setStartDate(parseLocalDate(data.start_date));
        if (data.end_date) {
          setEndDate(parseLocalDate(data.end_date));
        }
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error('Error al cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || !period || !startDate) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: numAmount,
          period,
          startDate: toLocalDateString(startDate),
          endDate: endDate ? toLocalDateString(endDate) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el presupuesto');
      }

      toast.success('Presupuesto actualizado exitosamente');
      router.push(`/dashboard/sobres/${budgetId}`);
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast.error(error.message || 'Error al actualizar el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Header */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Editar Presupuesto</CardTitle>
            <CardDescription>
              Modifica los detalles de tu presupuesto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Monto del Presupuesto <span className="text-red-500">*</span>
                </Label>
                <CurrencyInput
                  id="amount"
                  value={parseFloat(amount) || 0}
                  onValueChange={(value) => setAmount(value.toString())}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el monto máximo que deseas gastar en esta categoría
                </p>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label htmlFor="period">
                  Período <span className="text-red-500">*</span>
                </Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
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

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker value={startDate} onChange={setStartDate} />
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin (Opcional)</Label>
                  <DatePicker value={endDate} onChange={setEndDate} />
                  <p className="text-xs text-muted-foreground">
                    Si no especificas, el presupuesto no tendrá fecha límite
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
