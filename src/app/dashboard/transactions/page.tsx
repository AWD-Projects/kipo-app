"use client";

import { useEffect, useState } from "react";
import { Slide } from "@mui/material";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Edit2,
    Trash2,
    Calendar,
    DollarSign,
    Loader2,
    Search,
    Filter,
    X,
    Ellipsis,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, Card as CardType } from "@/types";
import { toast } from "@/lib/toast";
import { formatCurrency, parseCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useUser } from "@/hooks/useUser";
import { LoadingState } from "@/components/ui/loading-state";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

type TransactionWithCard = Transaction & {
    cards?: {
        id: string;
        name: string;
        brand: string;
    } | null;
};
import { createTransactionSchema, CreateTransactionInput } from "@/lib/validations/transaction";

const EXPENSE_CATEGORIES = [
    "Vivienda", "Alimentación", "Transporte", "Servicios", "Entretenimiento",
    "Salud", "Educación", "Ropa", "Personal", "Mascotas", "Deudas", "Otros"
];

const INCOME_CATEGORIES = [
    "Salario", "Freelance", "Inversiones", "Venta", "Regalo", "Reembolso", "Otros"
];

export default function TransactionsPage() {
    const { user, supabase } = useUser();
    const [transactions, setTransactions] = useState<TransactionWithCard[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    // Estados para filtros
    const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
    const [filters, setFilters] = useState({
        search: "",
        category: "all",
        cardId: "all",
        minAmount: "",
        maxAmount: ""
    });

    const [formData, setFormData] = useState<CreateTransactionInput>({
        title: "",
        type: "expense",
        amount: 0,
        category: "",
        description: "",
        transaction_date: new Date().toISOString().split("T")[0],
        card_id: undefined,
        is_recurring: false,
        recurring_frequency: "none",
        tags: [],
    });

    useEffect(() => {
        if (user?.id) {
            Promise.all([
                loadTransactions(user.id),
                loadCards(user.id)
            ]).finally(() => setLoading(false));
        }
    }, [user?.id]);

    const loadTransactions = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    cards (
                        id,
                        name,
                        brand
                    )
                `)
                .eq('user_id', userId)
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Error al cargar las transacciones');
        }
    };

    const loadCards = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;
            setCards(data || []);
        } catch (error) {
            console.error('Error loading cards:', error);
            toast.error('Error al cargar las tarjetas');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            if (editingTransaction) {
                // Update existing transaction
                const response = await fetch('/api/transactions', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: editingTransaction.id,
                        ...formData,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update transaction');
                }

                toast.success("Transacción actualizada: Los datos de la transacción se han actualizado correctamente.");
            } else {
                // Create new transaction
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create transaction');
                }

                toast.success("Transacción creada: La nueva transacción se ha agregado exitosamente.");
            }

            await loadTransactions(user.id);
            resetForm();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error(`Error: ${error instanceof Error ? error.message : "No se pudo guardar la transacción."}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setTransactionToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!transactionToDelete) return;

        const actionKey = `delete-${transactionToDelete}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));

        try {
            const response = await fetch(`/api/transactions/${transactionToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete transaction');
            }

            toast.success("Transacción eliminada: La transacción se ha eliminado correctamente.");

            if (user) await loadTransactions(user.id);
            setDeleteDialogOpen(false);
            setTransactionToDelete(null);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error(`Error: ${error instanceof Error ? error.message : "No se pudo eliminar la transacción."}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            type: "expense",
            amount: 0,
            category: "",
            description: "",
            transaction_date: new Date().toISOString().split("T")[0],
            card_id: undefined,
            is_recurring: false,
            recurring_frequency: "none",
            tags: [],
        });
        setEditingTransaction(null);
    };

    const openEditDialog = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            title: (transaction as any).title || "",
            type: transaction.type as "income" | "expense",
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description || "",
            transaction_date: transaction.transaction_date,
            card_id: transaction.card_id || undefined,
            is_recurring: transaction.is_recurring || false,
            recurring_frequency: (transaction.recurring_frequency as "none" | "daily" | "weekly" | "monthly" | "yearly") || "none",
            tags: transaction.tags || [],
        });
        setIsDialogOpen(true);
    };


    const getAvailableCategories = () => {
        return formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    };

    // Función para filtrar transacciones
    const filteredTransactions = transactions.filter(transaction => {
        // Filtro por pestaña activa
        if (activeTab === "income" && transaction.type !== "income") return false;
        if (activeTab === "expense" && transaction.type !== "expense") return false;
        
        // Filtro por búsqueda
        if (filters.search && !transaction.description?.toLowerCase().includes(filters.search.toLowerCase()) && 
            !transaction.category.toLowerCase().includes(filters.search.toLowerCase())) return false;
        
        // Filtro por categoría
        if (filters.category && filters.category !== "all" && transaction.category !== filters.category) return false;
        
        // Filtro por tarjeta
        if (filters.cardId && filters.cardId !== "all" && transaction.card_id !== filters.cardId) return false;
        
        // Filtro por rango de monto
        if (filters.minAmount && transaction.amount < parseFloat(filters.minAmount)) return false;
        if (filters.maxAmount && transaction.amount > parseFloat(filters.maxAmount)) return false;
        
        return true;
    });

    // Separar transacciones por tipo
    const incomeTransactions = filteredTransactions.filter(t => t.type === "income");
    const expenseTransactions = filteredTransactions.filter(t => t.type === "expense");

    // Función para limpiar filtros
    const clearFilters = () => {
        setFilters({
            search: "",
            category: "all",
            cardId: "all",
            minAmount: "",
            maxAmount: ""
        });
    };

    if (loading || !user) {
        return (
            <div className="kipo-dashboard-layout">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
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
                        <h1 className="kipo-page-title">Transacciones</h1>
                        <p className="kipo-page-description">
                            Gestiona tus ingresos y gastos
                        </p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm" className="kipo-mobile-full">
                        <Plus className="kipo-icon-sm mr-2" />
                        <span className="hidden sm:inline">Nueva Transacción</span>
                        <span className="sm:hidden">Nueva</span>
                    </Button>

                    {/* Compact Slide-up Dialog */}
                    <Slide direction="up" in={isDialogOpen} mountOnEnter unmountOnExit>
                        <div className="fixed inset-x-4 bottom-4 top-32 z-50 bg-background flex flex-col rounded-3xl shadow-2xl max-w-md mx-auto border">
                            {/* Header with close button */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-primary"
                                >
                                    Cancelar
                                </Button>
                                <h1 className="text-lg font-semibold">
                                    {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
                                </h1>
                                <div className="w-16"></div> {/* Spacer for centering */}
                            </div>
                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-sm font-medium text-foreground">
                                        Título <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        placeholder="Ej: Almuerzo, Café, Salario..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        aria-required="true"
                                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="type" className="text-sm font-medium text-foreground">
                                            Tipo <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: "income" | "expense") =>
                                                setFormData({ ...formData, type: value, category: "" })
                                            }
                                            required
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background" aria-required="true">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="expense">Gasto</SelectItem>
                                                <SelectItem value="income">Ingreso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                                            Monto <span className="text-destructive">*</span>
                                        </Label>
                                        <CurrencyInput
                                            id="amount"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                amount: value
                                            })}
                                            required
                                            aria-required="true"
                                            className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="category" className="text-sm font-medium text-foreground">
                                        Categoría <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        required
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background" aria-required="true">
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {getAvailableCategories().map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-sm font-medium text-foreground">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Descripción opcional..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="min-h-[80px] rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="date" className="text-sm font-medium text-foreground">
                                            Fecha <span className="text-destructive">*</span>
                                        </Label>
                                        <DatePicker
                                            value={formData.transaction_date}
                                            onChange={(date) => setFormData({
                                                ...formData,
                                                transaction_date: date ? format(date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]
                                            })}
                                            placeholder="Selecciona fecha"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="card" className="text-sm font-medium text-foreground">Tarjeta (opcional)</Label>
                                        <Select
                                            value={formData.card_id || "none"}
                                            onValueChange={(value) => setFormData({ 
                                                ...formData, 
                                                card_id: value === "none" ? undefined : value 
                                            })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background">
                                                <SelectValue placeholder="Sin tarjeta" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="none">Sin tarjeta</SelectItem>
                                                {cards.map((card) => (
                                                    <SelectItem key={card.id} value={card.id}>
                                                        {card.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* iPhone-style submit button */}
                                <div className="pt-4 pb-6">
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                {editingTransaction ? 'Actualizando...' : 'Creando...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingTransaction ? 'Actualizar' : 'Crear'} Transacción
                                            </>
                                        )}
                                    </Button>
                                </div>
                                </form>
                            </div>
                        </div>
                    </Slide>
                </div>

                {/* Filtros */}
                <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
                    {/* Búsqueda */}
                    <div className="relative w-full lg:flex-[2] min-w-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 kipo-icon-sm text-muted-foreground" />
                        <Input
                            placeholder="Buscar transacciones..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="pl-9 h-12"
                        />
                    </div>

                    {/* Categoría */}
                    <div className="w-full lg:flex-1 min-w-0">
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters({...filters, category: value})}
                        >
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {[...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])].map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tarjeta */}
                    <div className="w-full lg:flex-1 min-w-0">
                        <Select
                            value={filters.cardId}
                            onValueChange={(value) => setFilters({...filters, cardId: value})}
                        >
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Tarjeta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {cards.map((card) => (
                                    <SelectItem key={card.id} value={card.id}>
                                        {card.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Monto mínimo */}
                    <div className="w-full lg:w-36">
                        <CurrencyInput
                            placeholder="Mín."
                            value={filters.minAmount ? parseFloat(filters.minAmount) : 0}
                            onValueChange={(value) => setFilters({...filters, minAmount: value > 0 ? value.toString() : ""})}
                            className="h-10"
                        />
                    </div>

                    {/* Monto máximo */}
                    <div className="w-full lg:w-36">
                        <CurrencyInput
                            placeholder="Máx."
                            value={filters.maxAmount ? parseFloat(filters.maxAmount) : 0}
                            onValueChange={(value) => setFilters({...filters, maxAmount: value > 0 ? value.toString() : ""})}
                            className="h-10"
                        />
                    </div>

                    {/* Limpiar filtros */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilters}
                        className="h-10 w-10 flex-shrink-0 active:scale-95 transition-transform"
                        title="Limpiar filtros"
                    >
                        <X className="kipo-icon-sm" />
                    </Button>
                </div>

                {/* Pestañas y Transacciones */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "income" | "expense")}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">
                            Todas ({filteredTransactions.length})
                        </TabsTrigger>
                        <TabsTrigger value="income" className="text-green-600">
                            Ingresos ({incomeTransactions.length})
                        </TabsTrigger>
                        <TabsTrigger value="expense" className="text-red-600">
                            Egresos ({expenseTransactions.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        {filteredTransactions.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No hay transacciones</h3>
                                    <p className="text-muted-foreground mb-6">
                                        {transactions.length === 0 ? "Comienza agregando tu primera transacción" : "No se encontraron transacciones con los filtros aplicados"}
                                    </p>
                                    <Button onClick={() => setIsDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nueva Transacción
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((transaction) => (
                            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                                                transaction.type === 'income'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                            }`}>
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp className="kipo-icon-sm" />
                                                ) : (
                                                    <TrendingDown className="kipo-icon-sm" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm sm:text-base truncate">
                                                    {(transaction as any).title || transaction.category}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                    {transaction.category}
                                                    {transaction.description && (
                                                        <span className="hidden sm:inline"> • {transaction.description}</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{new Date(transaction.transaction_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>
                                                    {transaction.cards && (
                                                        <>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="hidden sm:inline truncate">
                                                                {transaction.cards.name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 flex-shrink-0">
                                            <div className="text-right">
                                                <div className={`text-base sm:text-lg font-semibold whitespace-nowrap ${
                                                    transaction.type === 'income'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                                        disabled={Object.values(actionLoading).some(loading => loading)}
                                                    >
                                                        <Ellipsis className="kipo-icon" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                                                        <Edit2 className="kipo-icon-sm" />
                                                        <span>Editar transacción</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(transaction.id)}
                                                        disabled={actionLoading[`delete-${transaction.id}`]}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="kipo-icon-sm" />
                                                        <span>Eliminar transacción</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                        )}
                    </TabsContent>

                    <TabsContent value="income" className="space-y-4">
                        {incomeTransactions.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No hay ingresos</h3>
                                    <p className="text-muted-foreground mb-6">
                                        {transactions.filter(t => t.type === "income").length === 0 ? "Agrega tu primer ingreso" : "No se encontraron ingresos con los filtros aplicados"}
                                    </p>
                                    <Button onClick={() => { setFormData({...formData, type: "income"}); setIsDialogOpen(true); }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nuevo Ingreso
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {incomeTransactions.map((transaction) => (
                                    <Card key={transaction.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                                                        <TrendingUp className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{transaction.description || transaction.category}</h3>
                                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                            <span>{transaction.category}</span>
                                                            <span>•</span>
                                                            <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                                                            {transaction.cards && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{transaction.cards.name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {transaction.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <div className="font-semibold text-green-600">
                                                            +{formatCurrency(transaction.amount)}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                disabled={Object.values(actionLoading).some(loading => loading)}
                                                            >
                                                                <Ellipsis className="kipo-icon" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                                                                <Edit2 className="kipo-icon-sm" />
                                                                <span>Editar transacción</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(transaction.id)}
                                                                disabled={actionLoading[`delete-${transaction.id}`]}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="kipo-icon-sm" />
                                                                <span>Eliminar transacción</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="expense" className="space-y-4">
                        {expenseTransactions.length === 0 ? (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <TrendingDown className="h-12 w-12 mx-auto text-red-500 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No hay egresos</h3>
                                    <p className="text-muted-foreground mb-6">
                                        {transactions.filter(t => t.type === "expense").length === 0 ? "Agrega tu primer egreso" : "No se encontraron egresos con los filtros aplicados"}
                                    </p>
                                    <Button onClick={() => { setFormData({...formData, type: "expense"}); setIsDialogOpen(true); }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nuevo Egreso
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {expenseTransactions.map((transaction) => (
                                    <Card key={transaction.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-2 rounded-full bg-red-100 text-red-600">
                                                        <TrendingDown className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{transaction.description || transaction.category}</h3>
                                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                            <span>{transaction.category}</span>
                                                            <span>•</span>
                                                            <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                                                            {transaction.cards && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{transaction.cards.name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {transaction.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <div className="font-semibold text-red-600">
                                                            -{formatCurrency(transaction.amount)}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                disabled={Object.values(actionLoading).some(loading => loading)}
                                                            >
                                                                <Ellipsis className="kipo-icon" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                                                                <Edit2 className="kipo-icon-sm" />
                                                                <span>Editar transacción</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(transaction.id)}
                                                                disabled={actionLoading[`delete-${transaction.id}`]}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="kipo-icon-sm" />
                                                                <span>Eliminar transacción</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. La transacción será eliminada permanentemente de tu cuenta.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={transactionToDelete ? actionLoading[`delete-${transactionToDelete}`] : false}
                            >
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={transactionToDelete ? actionLoading[`delete-${transactionToDelete}`] : false}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {transactionToDelete && actionLoading[`delete-${transactionToDelete}`] ? (
                                    <>
                                        <Loader2 className="kipo-icon animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    'Eliminar'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}