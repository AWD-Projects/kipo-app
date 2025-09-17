"use client";

import { useEffect, useState } from "react";
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
    const supabase = createClient();

    const [formData, setFormData] = useState<CreateTransactionInput>({
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
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Transacción
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingTransaction 
                                        ? 'Modifica los datos de tu transacción.'
                                        : 'Agrega una nueva transacción a tu registro financiero.'
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: "income" | "expense") => 
                                                setFormData({ ...formData, type: value, category: "" })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="expense">Gasto</SelectItem>
                                                <SelectItem value="income">Ingreso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Monto</Label>
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
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailableCategories().map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Descripción opcional..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Fecha</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.transaction_date}
                                            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card">Tarjeta (opcional)</Label>
                                        <Select
                                            value={formData.card_id || "none"}
                                            onValueChange={(value) => setFormData({ 
                                                ...formData, 
                                                card_id: value === "none" ? undefined : value 
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin tarjeta" />
                                            </SelectTrigger>
                                            <SelectContent>
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

                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingTransaction ? 'Actualizando...' : 'Creando...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingTransaction ? 'Actualizar' : 'Crear'} Transacción
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {transactions.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No hay transacciones</h3>
                            <p className="text-muted-foreground mb-6">
                                Comienza agregando tu primera transacción
                            </p>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Transacción
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((transaction) => (
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
                                                <h3 className="font-medium">{transaction.category}</h3>
                                                {transaction.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {transaction.description}
                                                    </p>
                                                )}
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
            </div>
        </div>
    );
}