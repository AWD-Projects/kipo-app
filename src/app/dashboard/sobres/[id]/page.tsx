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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Sparkles,
  Edit,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  title: string;
  description: string;
  transaction_date: string;
  category: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "on_track" | "warning" | "critical" | "exceeded";
  period: string;
  start_date: string;
  end_date: string | null;
  daysRemaining: number | null;
  aiSuggested: boolean;
  autoAdjust: boolean;
  created_at: string;
}

export default function BudgetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, supabase } = useUser();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const budgetId = params?.id as string;

  useEffect(() => {
    if (user?.id && budgetId) {
      loadBudgetDetails();
    }
  }, [user?.id, budgetId]);

  const loadBudgetDetails = async () => {
    if (!user?.id) return;

    try {
      // Load budget with predictions
      const budgetResponse = await fetch(`/api/budgets/current?predictions=true`);
      if (budgetResponse.ok) {
        const data = await budgetResponse.json();
        const foundBudget = data.budgets?.find((b: Budget) => b.id === budgetId);

        if (foundBudget) {
          setBudget(foundBudget);

          // Load transactions for this budget category
          // Validate dates before using them
          const startDate = foundBudget.start_date ? new Date(foundBudget.start_date) : null;
          const endDate = foundBudget.end_date ? new Date(foundBudget.end_date) : new Date();

          // Only fetch transactions if we have valid dates
          if (startDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const { data: txData, error: txError } = await supabase
              .from('transactions')
              .select('id, amount, title, description, transaction_date, category')
              .eq('user_id', user.id)
              .eq('type', 'expense')
              .eq('category', foundBudget.category)
              .gte('transaction_date', startDate.toISOString())
              .lte('transaction_date', endDate.toISOString())
              .order('transaction_date', { ascending: false });

            if (!txError && txData) {
              setTransactions(txData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading budget details:', error);
      toast.error('Error al cargar los detalles del presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!budget) return;

    const confirmed = confirm('¿Estás seguro de que deseas eliminar este presupuesto?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Presupuesto eliminado');
        router.push('/dashboard/sobres');
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Error al eliminar el presupuesto');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'on_track':
      default:
        return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-orange-100 text-orange-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_track':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'Excedido';
      case 'critical':
        return 'Crítico';
      case 'warning':
        return 'Advertencia';
      case 'on_track':
      default:
        return 'En camino';
    }
  };

  if (loading) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="kipo-dashboard-layout">
        <div className="kipo-stack-lg">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Presupuesto no encontrado</CardTitle>
              <CardDescription>
                El presupuesto que buscas no existe o no tienes acceso a él.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="kipo-dashboard-layout">
      <div className="kipo-stack-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/dashboard/sobres')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/sobres/${budget.id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(budget.status)}
                <div>
                  <CardTitle className="text-2xl">{budget.category}</CardTitle>
                  <CardDescription className="mt-1">
                    {budget.start_date && !isNaN(new Date(budget.start_date).getTime())
                      ? new Date(budget.start_date).toLocaleDateString('es-MX')
                      : 'Fecha no disponible'}
                    {budget.end_date && !isNaN(new Date(budget.end_date).getTime()) &&
                      ` - ${new Date(budget.end_date).toLocaleDateString('es-MX')}`}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getStatusColor(budget.status)}>
                {getStatusText(budget.status)}
              </Badge>
            </div>
            {budget.aiSuggested && (
              <Badge variant="outline" className="w-fit mt-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Sugerido por IA
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {formatCurrency(budget.spent)} de {formatCurrency(budget.amount)}
                </span>
                <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    budget.status === 'exceeded'
                      ? 'bg-red-600'
                      : budget.status === 'critical'
                      ? 'bg-orange-600'
                      : budget.status === 'warning'
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                  <p className="text-xl font-bold">{formatCurrency(budget.amount)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Gastado</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(budget.spent)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <TrendingUp className={`h-5 w-5 mt-0.5 ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Disponible</p>
                  <p className={`text-xl font-bold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(budget.remaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {budget.daysRemaining !== null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {budget.daysRemaining > 0
                    ? `${budget.daysRemaining} días restantes`
                    : 'Presupuesto vencido'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transacciones ({transactions.length})</CardTitle>
            <CardDescription>
              Gastos registrados en la categoría {budget.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay transacciones registradas para este presupuesto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{tx.title || tx.category || 'Sin título'}</p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tx.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(tx.transaction_date).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      -{formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
