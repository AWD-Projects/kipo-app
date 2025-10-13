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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Loader2,
  PiggyBank,
  Shield,
  Plane,
  Home,
  Car,
  GraduationCap,
  Heart,
  Gift,
  Target,
  Laptop,
  Briefcase,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { toLocalDateString, parseLocalDate } from "@/lib/dateUtils";

const GOAL_ICONS = [
  { value: 'piggy-bank', label: 'Alcancía', icon: PiggyBank },
  { value: 'shield', label: 'Protección', icon: Shield },
  { value: 'plane', label: 'Viaje', icon: Plane },
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'car', label: 'Auto', icon: Car },
  { value: 'graduation-cap', label: 'Educación', icon: GraduationCap },
  { value: 'heart', label: 'Salud', icon: Heart },
  { value: 'gift', label: 'Regalo', icon: Gift },
  { value: 'target', label: 'Meta', icon: Target },
  { value: 'laptop', label: 'Tecnología', icon: Laptop },
  { value: 'briefcase', label: 'Negocio', icon: Briefcase },
  { value: 'users', label: 'Familia', icon: Users },
];

const GOAL_COLORS = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Naranja" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#8b5cf6", label: "Morado" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#84cc16", label: "Lima" },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: "🔴 Alta", description: "Urgente e importante" },
  { value: 2, label: "🟠 Media-Alta", description: "Importante" },
  { value: 3, label: "🟡 Media", description: "Moderada" },
  { value: 4, label: "🟢 Media-Baja", description: "Flexible" },
  { value: 5, label: "⚪ Baja", description: "Cuando sea posible" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Activa", description: "Meta en progreso" },
  { value: "paused", label: "Pausada", description: "Temporalmente detenida" },
  {
    value: "abandoned",
    label: "Abandonada",
    description: "Ya no se persigue",
  },
];

export default function EditarMetaPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalData, setGoalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: 0,
    target_date: undefined as Date | undefined,
    icon: "piggy-bank",
    color: "#3b82f6",
    priority: 3,
    status: "active",
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

      // Populate form with existing data
      const goal = data.goal;
      setFormData({
        name: goal.name || "",
        description: goal.description || "",
        target_amount: goal.target_amount || 0,
        target_date: goal.target_date ? parseLocalDate(goal.target_date) : undefined,
        icon: goal.icon || "piggy-bank",
        color: goal.color || "#3b82f6",
        priority: goal.priority || 3,
        status: goal.status || "active",
      });
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

    if (!formData.name || !formData.target_amount) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    if (formData.target_amount <= 0) {
      toast.error("El monto objetivo debe ser mayor a 0");
      return;
    }

    // Don't allow reducing target below current amount
    if (
      goalData?.goal?.current_amount &&
      formData.target_amount < goalData.goal.current_amount
    ) {
      toast.error(
        "El monto objetivo no puede ser menor al monto ya ahorrado"
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          target_date: formData.target_date ? toLocalDateString(formData.target_date) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar meta");
      }

      toast.success("Meta actualizada exitosamente");
      router.push(`/dashboard/metas/${goalId}`);
    } catch (error: any) {
      console.error("Error updating goal:", error);
      toast.error(error.message || "Error al actualizar meta");
    } finally {
      setSaving(false);
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

  const { goal } = goalData;
  const selectedIcon = GOAL_ICONS.find((i) => i.value === formData.icon);
  const isCompleted = goal.status === "completed";

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
            <h1 className="kipo-page-title">Editar Meta</h1>
            <p className="kipo-page-description">
              Actualiza los detalles de tu meta
            </p>
          </div>
        </div>

        {isCompleted && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-yellow-900">
                ⚠️ Esta meta está completada. Puedes editar algunos campos,
                pero el monto objetivo no debería reducirse.
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="kipo-stack">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Actualiza los detalles principales de tu meta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre de la Meta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Fondo de emergencia, Vacaciones, Auto nuevo"
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe tu meta y por qué es importante para ti"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <Label htmlFor="target_amount">
                  Monto Objetivo <span className="text-red-500">*</span>
                </Label>
                <CurrencyInput
                  id="target_amount"
                  value={formData.target_amount}
                  onValueChange={(value) =>
                    setFormData({ ...formData, target_amount: value })
                  }
                  placeholder="30000.00"
                />
                {goal.current_amount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Ya tienes ahorrado{" "}
                    <strong>{formatCurrency(goal.current_amount)}</strong>. El
                    monto objetivo debe ser mayor o igual a esta cantidad.
                  </p>
                )}
              </div>

              {/* Target Date */}
              <div className="space-y-2">
                <Label htmlFor="target_date">Fecha Objetivo (opcional)</Label>
                <DatePicker
                  value={formData.target_date}
                  onChange={(date) =>
                    setFormData({ ...formData, target_date: date })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  ¿Cuándo te gustaría alcanzar esta meta?
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalización</CardTitle>
              <CardDescription>
                Ícono y color de tu meta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Icon and Color in one row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Icon */}
                <div className="space-y-2">
                  <Label>Ícono</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) =>
                      setFormData({ ...formData, icon: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {(() => {
                          const IconComponent = selectedIcon?.icon;
                          return (
                            <span className="flex items-center gap-2">
                              {IconComponent && <IconComponent className="h-4 w-4" />}
                              <span>{selectedIcon?.label}</span>
                            </span>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_ICONS.map((goalIcon) => {
                        const IconComponent = goalIcon.icon;
                        return (
                          <SelectItem key={goalIcon.value} value={goalIcon.value}>
                            <span className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{goalIcon.label}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {GOAL_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, color: color.value })
                        }
                        className={`w-12 h-12 rounded-full border-3 transition-all active:scale-95 ${
                          formData.color === color.value
                            ? "border-primary scale-110 shadow-lg"
                            : "border-muted-foreground/20"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                        aria-label={`Seleccionar color ${color.label}`}
                        aria-pressed={formData.color === color.value}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              {!isCompleted && (
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href={`/dashboard/metas/${goalId}`} className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={saving}
              >
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
