"use client";

import { useEffect, useState } from "react";
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
    Settings,
    Key,
    Copy,
    Trash2,
    ExternalLink,
    Smartphone,
    AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiKeyResponse, CreateApiKeyResponse } from "@/types";
import Link from "next/link";

export default function SettingsPage() {
    const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
    const [newToken, setNewToken] = useState<string>("");
    // const [newApiKey, setNewApiKey] = useState<ApiKeyResponse | null>(null);
    const [keyName, setKeyName] = useState("iOS Shortcut Token");
    const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
    const [profile, setProfile] = useState<{ full_name?: string; currency?: string; language?: string; timezone?: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await Promise.all([
                    loadApiKeys(),
                    loadProfile(user.id)
                ]);
            }
        };
        getUser();
    }, [supabase.auth]);

    const loadApiKeys = async () => {
        try {
            const response = await fetch('/api/api-keys');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al cargar API keys');
            }
            
            setApiKeys(data.api_keys || []);
        } catch (error) {
            console.error('Error loading API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore not found error
                throw error;
            }
            
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleCreateApiKey = async () => {
        try {
            const response = await fetch('/api/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: keyName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear API key');
            }

            const data: CreateApiKeyResponse = await response.json();

            setNewToken(data.token);
            // setNewApiKey(data.api_key);
            setIsDialogOpen(false);
            setIsTokenDialogOpen(true);
            setKeyName("iOS Shortcut Token");
            
            await loadApiKeys();
        } catch (error) {
            console.error('Error creating API key:', error);
            alert('Error al crear la API key');
        }
    };

    const handleRevokeApiKey = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres revocar esta API key? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/api-keys/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al revocar API key');
            }

            await loadApiKeys();
        } catch (error) {
            console.error('Error revoking API key:', error);
            alert('Error al revocar la API key');
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Could add a toast notification here
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Nunca';
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading || !user) {
        return (
            <div className="kipo-dashboard-layout">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="space-y-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    return (
        <div className="kipo-dashboard-layout">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        Configuración
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona tu perfil y configuraciones de la aplicación
                    </p>
                </div>

                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Perfil de Usuario
                        </CardTitle>
                        <CardDescription>
                            Información básica de tu cuenta
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Nombre completo</Label>
                                <div className="text-sm mt-1">
                                    {profile?.full_name || user?.user_metadata?.full_name || 'No configurado'}
                                </div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <div className="text-sm mt-1">{user?.email}</div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Moneda</Label>
                                <div className="text-sm mt-1">{profile?.currency || 'MXN'}</div>
                            </div>
                            <div>
                                <Label>Idioma</Label>
                                <div className="text-sm mt-1">{profile?.language || 'es'}</div>
                            </div>
                            <div>
                                <Label>Zona horaria</Label>
                                <div className="text-sm mt-1">{profile?.timezone || 'America/Mexico_City'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Keys Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    API Keys para iOS Shortcuts
                                </CardTitle>
                                <CardDescription>
                                    Genera tokens seguros para usar con Shortcuts de iOS
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Link href="/docs/shortcuts">
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Ver Guía
                                    </Button>
                                </Link>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Crear Token
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Crear nuevo token para iOS Shortcuts</DialogTitle>
                                            <DialogDescription>
                                                Este token te permitirá crear transacciones desde Shortcuts de iOS
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="keyName">Nombre del token</Label>
                                                <Input
                                                    id="keyName"
                                                    value={keyName}
                                                    onChange={(e) => setKeyName(e.target.value)}
                                                    placeholder="Ej: iPhone Shortcuts"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleCreateApiKey}>
                                                Crear Token
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-8">
                                <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No hay tokens creados</h3>
                                <p className="text-muted-foreground mb-6">
                                    Crea tu primer token para usar con Shortcuts de iOS
                                </p>
                                <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Token
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {apiKeys.map((apiKey) => (
                                    <div 
                                        key={apiKey.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium">{apiKey.name}</h4>
                                                <Badge variant={apiKey.revoked_at ? "destructive" : "default"}>
                                                    {apiKey.revoked_at ? 'Revocado' : 'Activo'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <div>Creado: {formatDate(apiKey.created_at)}</div>
                                                <div>Último uso: {formatDate(apiKey.last_used_at)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!apiKey.revoked_at && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevokeApiKey(apiKey.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Token Display Dialog */}
                <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                Token creado exitosamente
                            </DialogTitle>
                            <DialogDescription>
                                <strong>¡IMPORTANTE!</strong> Copia este token ahora. No podrás verlo nuevamente por seguridad.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Token para iOS Shortcuts</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newToken}
                                        readOnly
                                        className="font-mono text-xs"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => copyToClipboard(newToken)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <h4 className="font-medium text-amber-800 mb-2">Próximos pasos:</h4>
                                <ol className="text-sm text-amber-700 space-y-1">
                                    <li>1. Copia el token completo</li>
                                    <li>2. Ve a la <Link href="/docs/shortcuts" className="underline">guía de configuración</Link></li>
                                    <li>3. Configura tu Shortcut de iOS</li>
                                    <li>4. ¡Empieza a registrar gastos desde tu iPhone!</li>
                                </ol>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsTokenDialogOpen(false)}>
                                Entendido
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}