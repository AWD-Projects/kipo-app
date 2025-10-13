'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, FileText, Calendar, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parseLocalDate } from '@/lib/dateUtils';

interface MonthlySummary {
  id: string;
  user_id: string;
  month: string;
  transaction_count: number;
  expenses: number;
  income: number;
  net: number;
  created_at: string;
  updated_at: string;
}

interface GenerationResult {
  month: string;
  users_processed: number;
  errors: number;
  duration_ms: number;
  status: string;
  timestamp: string;
  errorMessage?: string;
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [lastGeneration, setLastGeneration] = useState<GenerationResult | null>(null);

  const supabase = createClient();

  // Load existing summaries
  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    try {
      setLoadingSummaries(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('monthly_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })
        .limit(12);

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error loading summaries:', error);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setLastGeneration(null);

    try {
      const month = selectedMonth || undefined;

      const response = await fetch('/api/reportes/monthly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate',
          month
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (like no transactions) gracefully
        const errorMsg = data.details || data.error || 'Error al generar reporte';
        setLastGeneration({
          month: selectedMonth || 'N/A',
          users_processed: 0,
          errors: 1,
          duration_ms: 0,
          status: 'error',
          timestamp: new Date().toISOString(),
          errorMessage: errorMsg
        });
        return; // Exit without throwing
      }

      // Set generation result
      setLastGeneration({
        month: data.result.month,
        users_processed: data.result.users_processed,
        errors: data.result.errors,
        duration_ms: data.result.duration_ms,
        status: data.result.status,
        timestamp: new Date().toISOString()
      });

      // Reload summaries to show the new one
      await loadSummaries();

      // Clear selected month
      setSelectedMonth('');

    } catch (error) {
      console.error('Error:', error);
      setLastGeneration({
        month: selectedMonth || 'N/A',
        users_processed: 0,
        errors: 1,
        duration_ms: 0,
        status: 'error',
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (monthString: string) => {
    // monthString format is "YYYY-MM"
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Reportes Mensuales</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Genera y consulta tus resúmenes financieros mensuales
        </p>
      </div>

      {/* Generator Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5" />
            Generar Reporte
          </CardTitle>
          <CardDescription>
            Calcula el resumen financiero de un mes específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="month-select" className="text-sm">
                Mes a generar
              </Label>
              <Input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={getCurrentMonth()}
                disabled={loading}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Last Generation Result */}
          {lastGeneration && (
            <div className={`p-4 rounded-lg border ${
              lastGeneration.status === 'success'
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {lastGeneration.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-sm">
                    {lastGeneration.status === 'success'
                      ? 'Reporte generado exitosamente'
                      : lastGeneration.errorMessage || 'Error al generar reporte'
                    }
                  </p>
                  {lastGeneration.status === 'success' && (
                    <div className="text-xs space-y-0.5 opacity-90">
                      <p>Mes: {lastGeneration.month}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Summaries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Historial de Reportes</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSummaries}
            disabled={loadingSummaries}
          >
            {loadingSummaries ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {loadingSummaries ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Cargando reportes...</span>
              </div>
            </CardContent>
          </Card>
        ) : summaries.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-3 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto opacity-50" />
                <p className="font-medium">No hay reportes generados</p>
                <p className="text-sm">Genera tu primer reporte mensual arriba</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">
                        {formatDate(summary.month)}
                      </CardTitle>
                    </div>
                    <Badge variant={summary.net >= 0 ? 'success' : 'destructive'} className="text-xs">
                      {summary.net >= 0 ? 'Positivo' : 'Negativo'}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {parseLocalDate(summary.updated_at.split('T')[0]).toLocaleDateString('es-MX')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transacciones:</span>
                      <span className="font-medium">{summary.transaction_count}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400">Ingresos:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(summary.income)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 dark:text-red-400">Gastos:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(summary.expenses)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-semibold">Balance:</span>
                      <span className={`font-bold text-lg ${
                        summary.net >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(summary.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Generación automática</p>
              <p className="text-xs">
                Los reportes se generan automáticamente el día 1 de cada mes a las 2:00 AM.
                También puedes generar reportes manualmente para cualquier mes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
