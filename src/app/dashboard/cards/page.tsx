"use client";

import { useEffect, useState } from "react";
import { Slide } from "@mui/material";
import { CreditCard as DefaultCardIcon } from "lucide-react";
import {
    SiVisa,
    SiMastercard,
    SiAmericanexpress,
    SiDiscover
} from "react-icons/si";
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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);
    const supabase = createClient();

    const [formData, setFormData] = useState<CreateCardInput>({
        name: "",
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
                    body: JSON.stringify(formData),
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
        });
        setIsDialogOpen(true);
    };

    const getBrandIcon = (brand: string) => {
        const iconClass = "h-10 w-10";

        switch (brand.toLowerCase()) {
            case 'visa':
                return <SiVisa className={`${iconClass} text-[#1A1F71]`} />;
            case 'mastercard':
                return <SiMastercard className={`${iconClass} text-[#EB001B]`} />;
            case 'amex':
                return <SiAmericanexpress className={`${iconClass} text-[#006FCF]`} />;
            case 'discover':
                return <SiDiscover className={`${iconClass} text-[#FF6000]`} />;
            default:
                return <DefaultCardIcon className="h-8 w-8 text-muted-foreground" />;
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
                                                className={`w-10 h-10 rounded-full border-3 transition-all ${
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
                    <div className="kipo-grid-3">
                        {cards.map((card) => (
                            <Card
                                key={card.id}
                                className={`relative overflow-hidden transition-all ${
                                    !card.is_active ? 'opacity-60' : ''
                                }`}
                            >
                                <div
                                    className="absolute inset-0 opacity-10"
                                    style={{ backgroundColor: card.color || '#4F46E5' }}
                                />
                                <CardHeader className="relative pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base sm:text-lg truncate">{card.name}</CardTitle>
                                            <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                                                {card.brand} • {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={card.is_active ? "default" : "secondary"}
                                            className="text-xs flex-shrink-0"
                                        >
                                            {card.is_active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-shrink-0">
                                            {getBrandIcon(card.brand)}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    disabled={Object.values(actionLoading).some(loading => loading)}
                                                >
                                                    <Ellipsis className="kipo-icon" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => openEditDialog(card)}
                                                >
                                                    <Edit2 className="kipo-icon-sm" />
                                                    <span>Editar tarjeta</span>
                                                </DropdownMenuItem>
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
            </div>
        </div>
    );
}