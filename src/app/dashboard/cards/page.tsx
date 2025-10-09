"use client";

import { useEffect, useState } from "react";
import { Slide } from "@mui/material";
import { CreditCard as DefaultCardIcon, DollarSign } from "lucide-react";
import {
    SiVisa,
    SiMastercard,
    SiAmericanexpress,
    SiDiscover
} from "react-icons/si";
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
    CreditCard,
    Edit2,
    Trash2,
    Power,
    Loader2,
    Ellipsis,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card as BaseCardType } from "@/types";
import { CreateCardInput } from "@/lib/validations/card";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";

// Extended Card type with new payment fields
type CardType = BaseCardType & {
    interest_free_payment_amount?: number;
    payment_due_date?: string | null;
    statement_closing_date?: string | null;
    reminder_days_before?: number;
};
import { toast } from "@/lib/toast";
import { DatePicker } from "@/components/ui/date-picker";

const CARD_BRANDS = [
    { value: "visa", label: "Visa" },
    { value: "mastercard", label: "Mastercard" },
    { value: "amex", label: "American Express" },
    { value: "discover", label: "Discover" },
    { value: "other", label: "Otra" },
];

const CARD_COLORS = [
    "#4F46E5", "#059669", "#DC2626", "#7C3AED", 
    "#EA580C", "#0891B2", "#BE185D", "#65A30D"
];

export default function CardsPage() {
    const [cards, setCards] = useState<CardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardType | null>(null);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [editingPaymentCard, setEditingPaymentCard] = useState<CardType | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [isPaymentFocused, setIsPaymentFocused] = useState(false);
    const [isFormPaymentFocused, setIsFormPaymentFocused] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState<CreateCardInput>({
        name: "",
        card_type: "credit",
        brand: "visa",
        color: "#4F46E5",
        is_active: true,
        interest_free_payment_amount: 0,
        payment_due_date: null,
        statement_closing_date: null,
        reminder_days_before: 0,
        reminder_time: "09:00",
    });

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await loadCards(user.id);
            }
        };
        getUser();
    }, [supabase.auth]);

    const loadCards = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCards(data || []);
        } catch (error) {
            console.error('Error loading cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            // Ensure interest_free_payment_amount is always a number (0 if empty/undefined)
            const sanitizedFormData = {
                ...formData,
                interest_free_payment_amount: formData.interest_free_payment_amount || 0
            };

            if (editingCard) {
                // Update existing card
                const response = await fetch('/api/cards', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: editingCard.id,
                        ...sanitizedFormData,
                    }),
                });

                if (!response.ok) {
                    let errorMessage = 'Failed to update card';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }

                toast.success("Tarjeta actualizada: Los datos de la tarjeta se han actualizado correctamente.");
            } else {
                // Create new card
                const response = await fetch('/api/cards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(sanitizedFormData),
                });

                if (!response.ok) {
                    let errorMessage = 'Failed to create card';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }

                toast.success("Tarjeta creada: La nueva tarjeta se ha agregado exitosamente.");
            }

            await loadCards(user.id);
            resetForm();
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error saving card:', error);
            toast.error(error instanceof Error ? error.message : "No se pudo guardar la tarjeta.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (card: CardType) => {
        const actionKey = `toggle-${card.id}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));
        
        // Optimistic update
        setCards(prevCards => 
            prevCards.map(c => 
                c.id === card.id ? { ...c, is_active: !c.is_active } : c
            )
        );

        try {
            const response = await fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_active: !card.is_active,
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to toggle card status';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            toast.success(`Tarjeta ${card.is_active ? 'desactivada' : 'activada'}: La tarjeta ${card.name} ha sido ${card.is_active ? 'desactivada' : 'activada'}.`);

            // Reload to ensure consistency
            if (user) await loadCards(user.id);
        } catch (error) {
            console.error('Error toggling card status:', error);
            // Revert optimistic update
            setCards(prevCards => 
                prevCards.map(c => 
                    c.id === card.id ? { ...c, is_active: card.is_active } : c
                )
            );
            toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado de la tarjeta.");
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    const handleDeleteClick = (id: string) => {
        setCardToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!cardToDelete) return;

        const actionKey = `delete-${cardToDelete}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));

        try {
            const response = await fetch(`/api/cards/${cardToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete card';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            toast.success("Tarjeta eliminada: La tarjeta se ha eliminado correctamente.");

            if (user) await loadCards(user.id);
            setDeleteDialogOpen(false);
            setCardToDelete(null);
        } catch (error) {
            console.error('Error deleting card:', error);
            toast.error(error instanceof Error ? error.message : "No se pudo eliminar la tarjeta.");
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            card_type: "credit",
            brand: "visa",
            color: "#4F46E5",
            is_active: true,
            interest_free_payment_amount: 0,
            payment_due_date: null,
            statement_closing_date: null,
            reminder_days_before: 0,
            reminder_time: "09:00",
        });
        setEditingCard(null);
    };

    const openEditDialog = (card: CardType) => {
        setEditingCard(card);
        setFormData({
            name: card.name,
            card_type: card.card_type as "credit" | "debit",
            brand: card.brand as "visa" | "mastercard" | "amex" | "discover" | "other",
            color: card.color || "#4F46E5",
            is_active: card.is_active ?? true,
            interest_free_payment_amount: card.interest_free_payment_amount || 0,
            payment_due_date: card.payment_due_date || null,
            statement_closing_date: card.statement_closing_date || null,
            reminder_days_before: card.reminder_days_before ?? 0,
            reminder_time: (card as any).reminder_time || "09:00",
        });
        setIsDialogOpen(true);
    };

    const openEditPaymentDialog = (card: CardType) => {
        setEditingPaymentCard(card);
        setPaymentAmount(card.interest_free_payment_amount || 0);
        setIsPaymentDialogOpen(true);
    };

    const handleUpdatePayment = async () => {
        if (!editingPaymentCard) return;

        setIsSubmitting(true);

        // Optimistic update
        setCards(prevCards =>
            prevCards.map(c =>
                c.id === editingPaymentCard.id
                    ? { ...c, interest_free_payment_amount: paymentAmount }
                    : c
            )
        );

        try {
            const response = await fetch('/api/cards', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPaymentCard.id,
                    interest_free_payment_amount: paymentAmount,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update payment amount');
            }

            const updatedCard = await response.json();

            // Update with server response to ensure consistency
            setCards(prevCards =>
                prevCards.map(c =>
                    c.id === updatedCard.id ? updatedCard : c
                )
            );

            toast.success('Monto de pago actualizado correctamente');
            setIsPaymentDialogOpen(false);
            setEditingPaymentCard(null);
        } catch (error) {
            console.error('Error updating payment:', error);
            // Revert optimistic update on error
            if (user) await loadCards(user.id);
            toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el monto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatNumberWithCommas = (value: number, includeCurrency = false): string => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
        return includeCurrency ? `$${formatted}` : formatted;
    };

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const getBrandIcon = (brand: string) => {
        const iconClass = "h-10 w-10 text-white";

        switch (brand.toLowerCase()) {
            case 'visa':
                return <SiVisa className={iconClass} />;
            case 'mastercard':
                return <SiMastercard className={iconClass} />;
            case 'amex':
                return <SiAmericanexpress className={iconClass} />;
            case 'discover':
                return <SiDiscover className={iconClass} />;
            default:
                return <DefaultCardIcon className="h-8 w-8 text-white" />;
        }
    };

    if (loading || !user) {
        return (
            <div className="kipo-dashboard-layout">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-48" />
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
                        <h1 className="kipo-page-title">Tarjetas</h1>
                        <p className="kipo-page-description">
                            Gestiona tus tarjetas de crédito y débito
                        </p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="default" className="kipo-mobile-full">
                        <Plus className="kipo-icon-sm" />
                        <span className="hidden sm:inline">Agregar Tarjeta</span>
                        <span className="sm:hidden">Agregar</span>
                    </Button>

                    {/* Compact Slide-up Dialog */}
                    <Slide direction="up" in={isDialogOpen} mountOnEnter unmountOnExit>
                        <div className="fixed inset-x-4 bottom-4 top-32 z-50 bg-background flex flex-col rounded-3xl shadow-2xl max-w-md mx-auto border">
                            {/* Header with close button */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    size="sm"
                                >
                                    Cancelar
                                </Button>
                                <h1 className="text-lg font-semibold">
                                    {editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
                                </h1>
                                <div className="w-20"></div> {/* Spacer for centering */}
                            </div>
                            
                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto">
                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Nombre de la tarjeta</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej: Tarjeta Principal"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="type" className="text-sm font-medium text-foreground">Tipo</Label>
                                        <Select
                                            value={formData.card_type}
                                            onValueChange={(value: "credit" | "debit") => 
                                                setFormData({ ...formData, card_type: value })
                                            }
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="credit">Crédito</SelectItem>
                                                <SelectItem value="debit">Débito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="brand" className="text-sm font-medium text-foreground">Marca</Label>
                                        <Select
                                            value={formData.brand}
                                            onValueChange={(value) => setFormData({ ...formData, brand: value as "visa" | "mastercard" | "amex" | "discover" | "other" })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {CARD_BRANDS.map((brand) => (
                                                    <SelectItem key={brand.value} value={brand.value}>
                                                        {brand.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-foreground">Color de la tarjeta</Label>
                                    <div className="flex space-x-3 justify-center">
                                        {CARD_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`w-12 h-12 rounded-full border-3 transition-all active:scale-95 ${
                                                    formData.color === color
                                                        ? 'border-primary scale-110 shadow-lg'
                                                        : 'border-muted-foreground/20'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setFormData({ ...formData, color })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Credit card payment fields */}
                                {formData.card_type === 'credit' && (
                                    <div className="space-y-4 pt-4 border-t border-muted-foreground/20">
                                        <h3 className="text-sm font-semibold text-foreground">Información de Pago</h3>

                                        <div className="space-y-3">
                                            <Label htmlFor="interest_free_payment_amount" className="text-sm font-medium text-foreground">
                                                Pago para no generar intereses
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    $
                                                </span>
                                                <Input
                                                    id="interest_free_payment_amount"
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={
                                                        isFormPaymentFocused
                                                            ? formData.interest_free_payment_amount?.toString() || '0'
                                                            : formatNumberWithCommas(formData.interest_free_payment_amount || 0, false)
                                                    }
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9.]/g, '');
                                                        const numValue = parseFloat(value) || 0;
                                                        setFormData({ ...formData, interest_free_payment_amount: numValue });
                                                    }}
                                                    onFocus={(e) => {
                                                        setIsFormPaymentFocused(true);
                                                        if (formData.interest_free_payment_amount === 0) {
                                                            e.target.select();
                                                        }
                                                    }}
                                                    onBlur={() => setIsFormPaymentFocused(false)}
                                                    className="pl-8 h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="payment_due_date" className="text-sm font-medium text-foreground">
                                                    Fecha límite de pago
                                                </Label>
                                                <DatePicker
                                                    value={formData.payment_due_date || undefined}
                                                    onChange={(date: Date | undefined) => setFormData({
                                                        ...formData,
                                                        payment_due_date: date ? format(date, 'yyyy-MM-dd') : null
                                                    })}
                                                    placeholder="Selecciona fecha"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="statement_closing_date" className="text-sm font-medium text-foreground">
                                                    Fecha de corte
                                                </Label>
                                                <DatePicker
                                                    value={formData.statement_closing_date || undefined}
                                                    onChange={(date: Date | undefined) => setFormData({
                                                        ...formData,
                                                        statement_closing_date: date ? format(date, 'yyyy-MM-dd') : null
                                                    })}
                                                    placeholder="Selecciona fecha"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="reminder_days_before" className="text-sm font-medium text-foreground">
                                                    Días antes
                                                </Label>
                                                <Input
                                                    id="reminder_days_before"
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    min="0"
                                                    max="30"
                                                    value={formData.reminder_days_before === 0 ? '' : formData.reminder_days_before}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '') {
                                                            setFormData({ ...formData, reminder_days_before: 0 });
                                                        } else {
                                                            const numValue = parseInt(value);
                                                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 30) {
                                                                setFormData({ ...formData, reminder_days_before: numValue });
                                                            }
                                                        }
                                                    }}
                                                    className="h-12 rounded-xl border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                                    placeholder="0 = Sin recordatorio"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="reminder_time" className="text-sm font-medium text-foreground">
                                                    Hora
                                                </Label>
                                                <TimePicker
                                                    value={formData.reminder_time || '09:00'}
                                                    onChange={(time) => setFormData({ ...formData, reminder_time: time })}
                                                    placeholder="Selecciona hora"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit button */}
                                <div className="pt-4 pb-6">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="w-full rounded-xl"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="kipo-icon animate-spin" />
                                                {editingCard ? 'Actualizando...' : 'Agregando...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingCard ? 'Actualizar' : 'Agregar'} Tarjeta
                                            </>
                                        )}
                                    </Button>
                                </div>
                                </form>
                            </div>
                        </div>
                    </Slide>
                </div>

                {cards.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent className="kipo-stack">
                            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                                <h3 className="text-base sm:text-lg font-medium mb-2">No hay tarjetas</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Agrega tu primera tarjeta para comenzar a registrar transacciones
                                </p>
                            </div>
                            <Button onClick={() => setIsDialogOpen(true)} size="default">
                                <Plus className="kipo-icon-sm" />
                                Agregar Tarjeta
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Mobile: Simple list with accordion */}
                        <div className="md:hidden space-y-3">
                            {cards.map((card) => {
                                const isExpanded = expandedCardId === card.id;

                                return (
                                    <div
                                        key={card.id}
                                        className={`rounded-2xl overflow-hidden transition-all ${
                                            !card.is_active ? 'opacity-60' : ''
                                        }`}
                                        style={{
                                            background: `linear-gradient(135deg, ${card.color || '#4F46E5'} 0%, ${card.color || '#4F46E5'}dd 100%)`,
                                        }}
                                    >
                                        {/* Card Header - Always visible */}
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                                        >
                                            <div className="flex items-start justify-between text-white mb-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                                                        {getBrandIcon(card.brand)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold truncate">{card.name}</h3>
                                                            <Badge
                                                                variant={card.is_active ? "secondary" : "outline"}
                                                                className={`text-xs ${card.is_active ? 'bg-white/20 text-white border-0' : 'bg-white/10 text-white/70 border-white/30'}`}
                                                            >
                                                                {card.is_active ? 'Activa' : 'Inactiva'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-white/80 capitalize">
                                                            {card.brand} • {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <svg
                                                    className={`w-5 h-5 text-white/80 transition-transform flex-shrink-0 ${
                                                        isExpanded ? 'rotate-180' : ''
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>

                                            {/* Payment Info Preview - Always visible for credit cards */}
                                            {card.card_type === 'credit' && (
                                                <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-white/70">Pago sin intereses</p>
                                                            <p className="text-lg font-bold text-white">
                                                                ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(card.interest_free_payment_amount || 0)}
                                                            </p>
                                                        </div>
                                                        {card.payment_due_date ? (
                                                            <div className="text-right">
                                                                <p className="text-xs text-white/70">Vence</p>
                                                                <p className="text-sm font-semibold text-white">
                                                                    {new Date(card.payment_due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-right">
                                                                <p className="text-xs text-white/70">Sin fecha</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expandable Actions */}
                                        <div
                                            className={`transition-all duration-300 overflow-hidden ${
                                                isExpanded ? 'max-h-96' : 'max-h-0'
                                            }`}
                                        >
                                            <div className="px-4 pb-4 space-y-3">
                                                {/* Payment Details - Expanded view for credit cards */}
                                                {card.card_type === 'credit' && card.payment_due_date && (
                                                    <div className="bg-white/10 rounded-xl p-3 border border-white/20 text-white text-sm">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-white/80">
                                                                {(() => {
                                                                    const today = new Date();
                                                                    const dueDate = new Date(card.payment_due_date);
                                                                    const diffTime = dueDate.getTime() - today.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                    if (diffDays < 0) return 'Vencido';
                                                                    if (diffDays === 0) return 'Vence hoy';
                                                                    if (diffDays === 1) return 'Vence mañana';
                                                                    if (diffDays <= 7) return `Vence en ${diffDays} días`;
                                                                    return `${diffDays} días restantes`;
                                                                })()}
                                                            </p>
                                                        </div>
                                                        {card.statement_closing_date && (
                                                            <p className="text-xs text-white/70">
                                                                Fecha de corte: {new Date(card.statement_closing_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditDialog(card);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Editar tarjeta
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleActive(card);
                                                    }}
                                                    disabled={actionLoading[`toggle-${card.id}`]}
                                                >
                                                    {actionLoading[`toggle-${card.id}`] ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Procesando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="w-4 h-4 mr-2" />
                                                            {card.is_active ? 'Desactivar' : 'Activar'}
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-red-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(card.id);
                                                    }}
                                                    disabled={actionLoading[`delete-${card.id}`]}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Eliminar tarjeta
                                                </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: Gradient card design */}
                        <div className="hidden md:grid kipo-grid-3">
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] ${
                                        !card.is_active ? 'opacity-60' : ''
                                    }`}
                                    style={{
                                        background: `linear-gradient(135deg, ${card.color || '#4F46E5'} 0%, ${card.color || '#4F46E5'}dd 100%)`,
                                    }}
                                >
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                                    {/* Card Content */}
                                    <div className="relative p-5 text-white">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex-shrink-0">
                                                    {getBrandIcon(card.brand)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Badge
                                                        variant={card.is_active ? "secondary" : "outline"}
                                                        className={`text-xs mb-2 ${card.is_active ? 'bg-white/20 text-white border-0' : 'bg-white/10 text-white/70 border-white/30'}`}
                                                    >
                                                        {card.is_active ? 'Activa' : 'Inactiva'}
                                                    </Badge>
                                                    <h3 className="text-lg font-bold truncate">{card.name}</h3>
                                                    <p className="text-xs text-white/80 capitalize">
                                                        {card.brand} • {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full hover:bg-white/20 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                                        disabled={Object.values(actionLoading).some(loading => loading)}
                                                    >
                                                        <Ellipsis className="kipo-icon" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => openEditDialog(card)}>
                                                        <Edit2 className="kipo-icon-sm" />
                                                        <span>Editar tarjeta</span>
                                                    </DropdownMenuItem>
                                                    {card.card_type === 'credit' && (
                                                        <DropdownMenuItem onClick={() => openEditPaymentDialog(card)}>
                                                            <DollarSign className="kipo-icon-sm" />
                                                            <span>Editar pago</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleActive(card)}
                                                        disabled={actionLoading[`toggle-${card.id}`]}
                                                    >
                                                        {actionLoading[`toggle-${card.id}`] ? (
                                                            <>
                                                                <Loader2 className="kipo-icon-sm animate-spin" />
                                                                <span>Procesando...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Power className="kipo-icon-sm" />
                                                                <span>{card.is_active ? 'Desactivar' : 'Activar'}</span>
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(card.id)}
                                                        disabled={actionLoading[`delete-${card.id}`]}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="kipo-icon-sm" />
                                                        <span>Eliminar tarjeta</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Payment Info */}
                                        {card.card_type === 'credit' && (
                                            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-white/80 mb-1">Pago para no generar intereses</p>
                                                        <p className="text-2xl font-bold">
                                                            ${formatNumber(card.interest_free_payment_amount || 0)}
                                                        </p>
                                                    </div>
                                                    {card.payment_due_date ? (
                                                        <div className="bg-white/25 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/30 flex-shrink-0">
                                                            <p className="text-[10px] text-white/90 uppercase font-semibold mb-0.5">Vence</p>
                                                            <p className="text-lg font-bold leading-none">
                                                                {new Date(card.payment_due_date).toLocaleDateString('es-MX', { day: 'numeric' })}
                                                            </p>
                                                            <p className="text-[10px] text-white/90 uppercase font-medium mt-0.5">
                                                                {new Date(card.payment_due_date).toLocaleDateString('es-MX', { month: 'short' })}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/25 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/30 flex-shrink-0">
                                                            <p className="text-[10px] text-white/90 uppercase font-semibold">Sin fecha</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                        ))}
                        </div>
                    </>
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. La tarjeta será eliminada permanentemente de tu cuenta.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={cardToDelete ? actionLoading[`delete-${cardToDelete}`] : false}
                            >
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={cardToDelete ? actionLoading[`delete-${cardToDelete}`] : false}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {cardToDelete && actionLoading[`delete-${cardToDelete}`] ? (
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

                {/* Edit Payment Dialog with Slide Animation */}
                <Slide direction="up" in={isPaymentDialogOpen} mountOnEnter unmountOnExit>
                    <div className="fixed inset-x-4 bottom-4 top-32 z-50 bg-background flex flex-col rounded-3xl shadow-2xl max-w-md mx-auto border">
                        {/* Header with close button */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <Button
                                variant="ghost"
                                onClick={() => setIsPaymentDialogOpen(false)}
                                size="sm"
                            >
                                Cancelar
                            </Button>
                            <h1 className="text-lg font-semibold">
                                Editar Monto de Pago
                            </h1>
                            <div className="w-20"></div> {/* Spacer for centering */}
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-sm text-muted-foreground mb-6">
                                Modifica manualmente el pago para no generar intereses de <span className="font-semibold">{editingPaymentCard?.name}</span>
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label htmlFor="payment_amount" className="text-sm font-medium text-foreground">
                                        Monto de pago sin intereses
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                                            $
                                        </span>
                                        <Input
                                            id="payment_amount"
                                            type="text"
                                            inputMode="decimal"
                                            value={isPaymentFocused ? paymentAmount.toString() : formatNumberWithCommas(paymentAmount, false)}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                                const numValue = parseFloat(value) || 0;
                                                setPaymentAmount(numValue);
                                            }}
                                            onFocus={(e) => {
                                                setIsPaymentFocused(true);
                                                if (paymentAmount === 0) {
                                                    e.target.select();
                                                }
                                            }}
                                            onBlur={() => setIsPaymentFocused(false)}
                                            className="pl-8 h-14 rounded-xl text-xl font-semibold border-muted-foreground/20 bg-muted/30 focus:bg-background transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Nota: Este monto se calcula automáticamente basado en tus gastos, pero puedes modificarlo manualmente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer with action button */}
                        <div className="p-6 border-t">
                            <Button
                                onClick={handleUpdatePayment}
                                disabled={isSubmitting}
                                size="lg"
                                className="w-full rounded-xl"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="kipo-icon animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    'Guardar Cambios'
                                )}
                            </Button>
                        </div>
                    </div>
                </Slide>
            </div>
        </div>
    );
}