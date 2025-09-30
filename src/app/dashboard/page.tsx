"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    CreditCard,
    DollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useUser } from "@/hooks/useUser";

interface DashboardStats {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
    cardCount: number;
}

export default function DashboardPage() {
    const { user, supabase } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadDashboardStats(user.id);
        }
    }, [user?.id]); // Only depend on user.id

    const loadDashboardStats = async (userId: string) => {
        try {
            // Get transactions stats
            const { data: transactions } = await supabase
                .from('transactions')
                .select('type, amount')
                .eq('user_id', userId);

            // Get cards count
            const { data: cards } = await supabase
                .from('cards')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true);

            const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
            const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;

            setStats({
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
                transactionCount: transactions?.length || 0,
                cardCount: cards?.length || 0,
            });
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };


    if (loading || !stats) {
        return (
            <div className="kipo-dashboard-layout">
                <div className="kipo-stack-lg">
                    <Skeleton className="h-12 w-64" />
                    <div className="kipo-grid-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-lg" />
                        ))}
                    </div>
                    <div className="kipo-grid-2">
                        <Skeleton className="h-48 rounded-lg" />
                        <Skeleton className="h-48 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="kipo-dashboard-layout">
            <div className="kipo-stack-lg">
                {/* Page Header */}
                <div className="kipo-section-header">
                    <div>
                        <h1 className="kipo-page-title">Dashboard</h1>
                        <p className="kipo-page-description">
                            Bienvenido de vuelta, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="kipo-grid-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ingresos Totales
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats?.totalIncome || 0)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Gastos Totales
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(stats?.totalExpenses || 0)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Balance
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${
                                (stats?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {formatCurrency(stats?.balance || 0)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tarjetas Activas
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.cardCount || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                {stats?.transactionCount !== 0 && (
                    <div className="kipo-grid-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Acciones Rápidas</CardTitle>
                                <CardDescription>
                                    Administra tus finanzas fácilmente
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <Link href="/dashboard/transactions" className="block">
                                    <Button className="w-full justify-start gap-2" size="default">
                                        <Plus className="kipo-icon-sm" />
                                        Nueva Transacción
                                    </Button>
                                </Link>
                                <Link href="/dashboard/cards" className="block">
                                    <Button variant="outline" className="w-full justify-start gap-2" size="default">
                                        <CreditCard className="kipo-icon-sm" />
                                        Gestionar Tarjetas
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Resumen del Mes</CardTitle>
                                <CardDescription>
                                    {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Transacciones:</span>
                                        <span className="font-medium">{stats?.transactionCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Promedio por día:</span>
                                        <span className="font-medium">
                                            {formatCurrency((stats?.totalExpenses || 0) / new Date().getDate())}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Getting Started */}
                {stats?.transactionCount === 0 && (
                    <Card className="border-dashed">
                        <CardHeader className="text-center">
                            <CardTitle>¡Comienza a usar Kipo!</CardTitle>
                            <CardDescription>
                                Agrega tu primera transacción o tarjeta para comenzar a gestionar tus finanzas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center space-x-4">
                            <Link href="/dashboard/transactions">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Primera Transacción
                                </Button>
                            </Link>
                            <Link href="/dashboard/cards">
                                <Button variant="outline">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Agregar Tarjeta
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}