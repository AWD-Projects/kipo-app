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
import {
  ArrowLeft,
  Sparkles,
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { toLocalDateString } from "@/lib/dateUtils";

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
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Naranja' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#8b5cf6', label: 'Morado' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#84cc16', label: 'Lima' },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: '🔴 Alta', description: 'Urgente e importante' },
  { value: 2, label: '🟠 Media-Alta', description: 'Importante' },
  { value: 3, label: '🟡 Media', description: 'Moderada' },
  { value: 4, label: '🟢 Media-Baja', description: 'Flexible' },
  { value: 5, label: '⚪ Baja', description: 'Cuando sea posible' },
];

export default function NuevaMetaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: 0,
    target_date: undefined as Date | undefined,
    icon: "piggy-bank",
    color: "#3b82f6",
    priority: 3,
    initial_contribution: 0,
  });

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

    setLoading(true);

    try {
      const response = await fetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          target_date: formData.target_date ? toLocalDateString(formData.target_date) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear meta");
      }

      const data = await response.json();
      toast.success("¡Meta creada exitosamente!");

      router.push(`/dashboard/metas/${data.goal.id}`);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      toast.error(error.message || "Error al crear meta");
    } finally {
      setLoading(false);
    }
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
            <h1 className="kipo-page-title">Nueva Meta de Ahorro</h1>
            <p className="kipo-page-description">
              Crea una meta para alcanzar tus objetivos financieros
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="kipo-stack">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Define los detalles principales de tu meta
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
                          const selectedIcon = GOAL_ICONS.find((i) => i.value === formData.icon);
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contribución Inicial</CardTitle>
              <CardDescription>
                Comienza con un aporte inicial (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initial_contribution">
                  Monto Inicial (opcional)
                </Label>
                <CurrencyInput
                  id="initial_contribution"
                  value={formData.initial_contribution}
                  onValueChange={(value) =>
                    setFormData({ ...formData, initial_contribution: value })
                  }
                  placeholder="500.00"
                />
                <p className="text-sm text-muted-foreground">
                  Si ya tienes algo ahorrado para esta meta, agrégalo aquí
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/dashboard/metas" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Crear Meta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
