"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
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
    CreditCard,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card as CardType } from "@/types";
import { createCardSchema, CreateCardInput } from "@/lib/validations/card";
import { toast } from "@/lib/toast";

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
    const supabase = createClient();

    const [formData, setFormData] = useState<CreateCardInput>({
        name: "",
        last_four_digits: "",
        card_type: "credit",
        brand: "visa",
        color: "#4F46E5",
        is_active: true,
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
            if (editingCard) {
                // Update existing card
                const response = await fetch('/api/cards', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: editingCard.id,
                        ...formData,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update card');
                }

                toast.success("Tarjeta actualizada: Los datos de la tarjeta se han actualizado correctamente.");
            } else {
                // Create new card
                const response = await fetch('/api/cards', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create card');
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
                const error = await response.json();
                throw new Error(error.error || 'Failed to toggle card status');
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

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) return;

        const actionKey = `delete-${id}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));

        try {
            const response = await fetch(`/api/cards/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete card');
            }

            toast.success("Tarjeta eliminada: La tarjeta se ha eliminado correctamente.");

            if (user) await loadCards(user.id);
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
            last_four_digits: "",
            card_type: "credit",
            brand: "visa",
            color: "#4F46E5",
            is_active: true,
        });
        setEditingCard(null);
    };

    const openEditDialog = (card: CardType) => {
        setEditingCard(card);
        setFormData({
            name: card.name,
            last_four_digits: card.last_four_digits,
            card_type: card.card_type as "credit" | "debit",
            brand: card.brand as "visa" | "mastercard" | "amex" | "discover" | "other",
            color: card.color || "#4F46E5",
            is_active: card.is_active ?? true,
        });
        setIsDialogOpen(true);
    };

    const getBrandLogo = (brand: string) => {
        switch (brand) {
            case 'visa':
                return '💳';
            case 'mastercard':
                return '💳';
            case 'amex':
                return '💳';
            case 'discover':
                return '💳';
            default:
                return '💳';
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">
                            Tarjetas
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tus tarjetas de crédito y débito
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Tarjeta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingCard 
                                        ? 'Modifica los datos de tu tarjeta.'
                                        : 'Agrega una nueva tarjeta a tu billetera digital.'
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre de la tarjeta</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej: Tarjeta Principal"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Tipo</Label>
                                        <Select
                                            value={formData.card_type}
                                            onValueChange={(value: "credit" | "debit") => 
                                                setFormData({ ...formData, card_type: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="credit">Crédito</SelectItem>
                                                <SelectItem value="debit">Débito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Marca</Label>
                                        <Select
                                            value={formData.brand}
                                            onValueChange={(value) => setFormData({ ...formData, brand: value as "visa" | "mastercard" | "amex" | "discover" | "other" })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CARD_BRANDS.map((brand) => (
                                                    <SelectItem key={brand.value} value={brand.value}>
                                                        {brand.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_four_digits">Últimos 4 dígitos</Label>
                                    <Input
                                        id="last_four_digits"
                                        placeholder="1234"
                                        maxLength={4}
                                        value={formData.last_four_digits}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, last_four_digits: value });
                                        }}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Color de la tarjeta</Label>
                                    <div className="flex space-x-2">
                                        {CARD_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`w-8 h-8 rounded-full border-2 ${
                                                    formData.color === color 
                                                        ? 'border-primary' 
                                                        : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setFormData({ ...formData, color })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {editingCard ? 'Actualizando...' : 'Agregando...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingCard ? 'Actualizar' : 'Agregar'} Tarjeta
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {cards.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No hay tarjetas</h3>
                            <p className="text-muted-foreground mb-6">
                                Agrega tu primera tarjeta para comenzar a registrar transacciones
                            </p>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Tarjeta
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cards.map((card) => (
                            <Card 
                                key={card.id} 
                                className={`relative overflow-hidden ${
                                    !card.is_active ? 'opacity-60' : ''
                                }`}
                            >
                                <div 
                                    className="absolute inset-0 opacity-10"
                                    style={{ backgroundColor: card.color || '#4F46E5' }}
                                />
                                <CardHeader className="relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{getBrandLogo(card.brand)}</span>
                                            <div>
                                                <CardTitle className="text-lg">{card.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {card.brand} • {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge 
                                            variant={card.is_active ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {card.is_active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-lg font-mono">
                                            •••• •••• •••• {card.last_four_digits}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(card)}
                                            disabled={Object.values(actionLoading).some(loading => loading)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleActive(card)}
                                            disabled={actionLoading[`toggle-${card.id}`] || Object.values(actionLoading).some(loading => loading)}
                                        >
                                            {actionLoading[`toggle-${card.id}`] ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : card.is_active ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(card.id)}
                                            className="text-destructive hover:text-destructive"
                                            disabled={actionLoading[`delete-${card.id}`] || Object.values(actionLoading).some(loading => loading)}
                                        >
                                            {actionLoading[`delete-${card.id}`] ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
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