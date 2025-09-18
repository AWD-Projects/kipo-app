"use client";

import { useEffect, useState } from "react";
import { Slide } from "@mui/material";
import {
    Card,
    CardContent,
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
    Plus,
    TrendingUp,
    TrendingDown,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    Loader2,
    Search,
    Filter,
    X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, Card as CardType } from "@/types";
import { toast } from "@/lib/toast";

type TransactionWithCard = Transaction & {
    cards?: {
        id: string;
        name: string;
        last_four_digits: string;
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
    const [transactions, setTransactions] = useState<TransactionWithCard[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
    
    // Estados para filtros
    const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
    const [filters, setFilters] = useState({
        search: "",
        category: "all",
        cardId: "all",
        minAmount: "",
        maxAmount: ""
    });
    
    const supabase = createClient();

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
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await Promise.all([
                    loadTransactions(user.id),
                    loadCards(user.id)
                ]);
            }
        };
        getUser();
    }, [supabase.auth]);

    const loadTransactions = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    cards (
                        id,
                        name,
                        last_four_digits,
                        brand
                    )
                `)
                .eq('user_id', userId)
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
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

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;

        const actionKey = `delete-${id}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));

        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete transaction');
            }

            toast.success("Transacción eliminada: La transacción se ha eliminado correctamente.");

            if (user) await loadTransactions(user.id);
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">
                            Transacciones
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tus ingresos y gastos
                        </p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Transacción
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
                                    <Label htmlFor="title" className="text-sm font-medium text-foreground">Título</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ej: Almuerzo, Café, Salario..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="type" className="text-sm font-medium text-foreground">Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: "income" | "expense") => 
                                                setFormData({ ...formData, type: value, category: "" })
                                            }
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="expense">Gasto</SelectItem>
                                                <SelectItem value="income">Ingreso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="amount" className="text-sm font-medium text-foreground">Monto</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount || ""}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                amount: parseFloat(e.target.value) || 0 
                                            })}
                                            required
                                            className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="category" className="text-sm font-medium text-foreground">Categoría</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background">
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
                                        <Label htmlFor="date" className="text-sm font-medium text-foreground">Fecha</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.transaction_date}
                                            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                            required
                                            className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
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
                                                        {card.name} ****{card.last_four_digits}
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
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </h3>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearFilters}
                            className="text-xs"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                className="pl-10"
                            />
                        </div>
                        
                        {/* Categoría */}
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters({...filters, category: value})}
                        >
                            <SelectTrigger>
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
                        
                        {/* Tarjeta */}
                        <Select
                            value={filters.cardId}
                            onValueChange={(value) => setFilters({...filters, cardId: value})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tarjeta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {cards.map((card) => (
                                    <SelectItem key={card.id} value={card.id}>
                                        {card.name} ****{card.last_four_digits}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {/* Monto mínimo */}
                        <Input
                            type="number"
                            placeholder="Monto mín."
                            value={filters.minAmount}
                            onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                        />
                        
                        {/* Monto máximo */}
                        <Input
                            type="number"
                            placeholder="Monto máx."
                            value={filters.maxAmount}
                            onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                        />
                    </div>
                </Card>

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
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${
                                                transaction.type === 'income' 
                                                    ? 'bg-green-100 text-green-600' 
                                                    : 'bg-red-100 text-red-600'
                                            }`}>
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{(transaction as any).title || transaction.category}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {transaction.category}
                                                    {transaction.description && ` • ${transaction.description}`}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
                                                    </span>
                                                    {transaction.cards && (
                                                        <>
                                                            <span className="text-xs text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {transaction.cards.name} ****{transaction.cards.last_four_digits}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <div className={`text-lg font-semibold ${
                                                    transaction.type === 'income' 
                                                        ? 'text-green-600' 
                                                        : 'text-red-600'
                                                }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </div>
                                                {transaction.source && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {transaction.source}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(transaction)}
                                                    disabled={Object.values(actionLoading).some(loading => loading)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(transaction.id)}
                                                    className="text-destructive hover:text-destructive"
                                                    disabled={actionLoading[`delete-${transaction.id}`] || Object.values(actionLoading).some(loading => loading)}
                                                >
                                                    {actionLoading[`delete-${transaction.id}`] ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
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
                                                                    <span>{transaction.cards.name} ****{transaction.cards.last_four_digits}</span>
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
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(transaction)}
                                                            disabled={Object.values(actionLoading).some(loading => loading)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={actionLoading[`delete-${transaction.id}`] || Object.values(actionLoading).some(loading => loading)}
                                                        >
                                                            {actionLoading[`delete-${transaction.id}`] ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
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
                                                                    <span>{transaction.cards.name} ****{transaction.cards.last_four_digits}</span>
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
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(transaction)}
                                                            disabled={Object.values(actionLoading).some(loading => loading)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="text-destructive hover:text-destructive"
                                                            disabled={actionLoading[`delete-${transaction.id}`] || Object.values(actionLoading).some(loading => loading)}
                                                        >
                                                            {actionLoading[`delete-${transaction.id}`] ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}