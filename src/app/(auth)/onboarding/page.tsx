"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const EXPENSE_CATEGORIES = [
    "Vivienda",
    "Alimentación",
    "Transporte",
    "Servicios",
    "Entretenimiento",
    "Salud",
    "Educación",
    "Ropa",
    "Personal",
    "Mascotas",
    "Deudas",
    "Otros",
];

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [formData, setFormData] = useState({
        monthlyIncome: "",
        monthlyExpenses: "",
        savingsGoal: "",
        mainExpenseCategories: [] as string[],
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);
        };
        getUser();
    }, [router, supabase.auth]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const toggleCategory = (category: string) => {
        setFormData(prev => ({
            ...prev,
            mainExpenseCategories: prev.mainExpenseCategories.includes(category)
                ? prev.mainExpenseCategories.filter(c => c !== category)
                : [...prev.mainExpenseCategories, category]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        try {
            setIsLoading(true);
            setError("");

            const { error: updateError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    monthly_income: parseFloat(formData.monthlyIncome) || 0,
                    monthly_expenses: parseFloat(formData.monthlyExpenses) || 0,
                    savings_goal: parseFloat(formData.savingsGoal) || 0,
                    main_expense_categories: formData.mainExpenseCategories,
                    is_onboarded: true,
                });

            if (updateError) {
                setError(updateError.message);
                toast.error(`Error de configuración: ${updateError.message}`);
                return;
            }

            toast.success("¡Perfil completado!: Tu configuración se ha guardado exitosamente. Bienvenido a Kipo.");

            router.push("/dashboard");
        } catch (error) {
            const errorMessage = "Error al completar la configuración";
            setError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-primary/5">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        ¡Bienvenido a Kipo!
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Personaliza tu experiencia completando tu perfil financiero
                    </p>
                </div>

                <Card className="kipo-form-container max-w-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Configuración inicial
                        </CardTitle>
                        <CardDescription>
                            Esta información nos ayudará a personalizar tus recomendaciones
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {error && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                    {error}
                                </div>
                            )}
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyIncome">Ingresos mensuales (MXN)</Label>
                                    <Input
                                        id="monthlyIncome"
                                        name="monthlyIncome"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.monthlyIncome}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="monthlyExpenses">Gastos mensuales estimados (MXN)</Label>
                                    <Input
                                        id="monthlyExpenses"
                                        name="monthlyExpenses"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.monthlyExpenses}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="savingsGoal">Meta de ahorro mensual (MXN)</Label>
                                <Input
                                    id="savingsGoal"
                                    name="savingsGoal"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.savingsGoal}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Principales categorías de gastos</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {EXPENSE_CATEGORIES.map((category) => (
                                        <Button
                                            key={category}
                                            type="button"
                                            variant={formData.mainExpenseCategories.includes(category) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleCategory(category)}
                                            disabled={isLoading}
                                            className="text-xs transition-all"
                                        >
                                            {category}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selecciona las categorías donde más gastas habitualmente
                                </p>
                            </div>
                        </CardContent>
                        <div className="px-6 pb-6 pt-2">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        Completar configuración
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}