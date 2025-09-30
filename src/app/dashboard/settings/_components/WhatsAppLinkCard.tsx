// src/app/dashboard/settings/_components/WhatsAppLinkCard.tsx
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { InfoBanner } from "@/components/ui/info-banner";
import {
    Link as LinkIcon,
    Unlink,
    Loader2,
    MessageCircle,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    Smartphone,
    ExternalLink
} from "lucide-react";
import { toast } from "@/lib/toast";
import { formatPhoneDisplay } from "@/lib/phone";
import Link from "next/link";
import type {
    WhatsAppStatusResponse,
    WhatsAppLinkInitResponse,
    WhatsAppStatus
} from "@/types";

interface WhatsAppLinkCardProps {
    className?: string;
}

export default function WhatsAppLinkCard({ className }: WhatsAppLinkCardProps) {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [status, setStatus] = useState<WhatsAppStatus>("pending");
    const [statusData, setStatusData] = useState<WhatsAppStatusResponse | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/whatsapp/status', {
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar el estado');
            }

            const data = await response.json();
            if (data.ok && data.data) {
                setStatusData(data.data);
                setStatus(data.data.status);
                if (data.data.phone_e164) {
                    setPhoneNumber(data.data.phone_e164);
                }
            }
        } catch (error) {
            console.error('Error loading WhatsApp status:', error);
            toast.error('Error al cargar el estado de WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        // Validate phone format (+521 + 10 digits)
        const digits = phoneNumber.slice(4); // Remove +521
        if (digits.length !== 10) {
            toast.error('Ingresa un número válido de 10 dígitos');
            return;
        }

        const normalizedPhone = phoneNumber; // Already in E164 format

        try {
            setActionLoading(true);
            const response = await fetch('/api/whatsapp/link/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone_e164: normalizedPhone }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Error al generar el código');
            }

            const initData: WhatsAppLinkInitResponse = data.data;
            setVerificationCode(initData.verification_code);
            setCodeExpiresAt(initData.code_expires_at);
            setStatus('pending');
            setPhoneNumber(initData.phone_e164);
            
            toast.success('Código generado. Sigue las instrucciones para vincular tu WhatsApp.');
            
            // Refresh status after generation
            setTimeout(() => loadStatus(), 1000);

        } catch (error: any) {
            console.error('Error generating code:', error);
            toast.error(error.message || 'Error al generar el código');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlink = async () => {
        if (!confirm('¿Estás seguro de que quieres desvincular tu WhatsApp? Perderás la capacidad de crear transacciones por WhatsApp.')) {
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch('/api/whatsapp/unlink', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Error al desvincular');
            }

            setStatus('pending');
            setVerificationCode('');
            setCodeExpiresAt(null);
            setStatusData(null);
            
            toast.success('WhatsApp desvinculado exitosamente');
            loadStatus();

        } catch (error: any) {
            console.error('Error unlinking:', error);
            toast.error(error.message || 'Error al desvincular WhatsApp');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'verified':
                return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Vinculado</Badge>;
            case 'pending':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
            case 'revoked':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Desvinculado</Badge>;
            default:
                return <Badge variant="outline">Sin configurar</Badge>;
        }
    };

    const formatExpirationTime = (expiresAt: string) => {
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        const diffMs = expirationDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins <= 0) {
            return 'Expirado';
        }
        
        return `Expira en ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        WhatsApp
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-8 bg-muted rounded w-32"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Vinculación de WhatsApp
                        </CardTitle>
                        <CardDescription>
                            Conecta tu número de WhatsApp para registrar gastos por mensaje
                        </CardDescription>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {status === 'verified' && statusData ? (
                    // Verified state
                    <div className="space-y-4">
                        <InfoBanner variant="success">
                            Tu WhatsApp está vinculado exitosamente ✅
                        </InfoBanner>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <Label>Número vinculado</Label>
                                <div className="font-mono mt-1">
                                    {formatPhoneDisplay(statusData.phone_e164 || '')}
                                </div>
                            </div>
                            <div>
                                <Label>Último mensaje</Label>
                                <div className="mt-1">
                                    {statusData.last_seen_at
                                        ? new Date(statusData.last_seen_at).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'Nunca'
                                    }
                                </div>
                            </div>
                        </div>

                        {statusData.wa_profile_name && (
                            <div>
                                <Label>Perfil de WhatsApp</Label>
                                <div className="text-sm mt-1">{statusData.wa_profile_name}</div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setStatus('pending');
                                    setVerificationCode('');
                                    setCodeExpiresAt(null);
                                }}
                                disabled={actionLoading}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerar código
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleUnlink}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Unlink className="h-4 w-4 mr-2" />
                                )}
                                Desvincular
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Pending/setup state
                    <div className="space-y-4">
                        <Link href="/docs/whatsapp">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <ExternalLink className="kipo-icon-sm mr-2" />
                                Ver Guía de Vinculación
                            </Button>
                        </Link>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Número de WhatsApp</Label>
                            <div className="flex gap-2">
                                <PhoneInput
                                    id="phone"
                                    prefix="+521"
                                    maxDigits={10}
                                    value={phoneNumber}
                                    onValueChange={setPhoneNumber}
                                    disabled={actionLoading}
                                    placeholder="+5215551234567"
                                />
                                <Button
                                    onClick={handleGenerateCode}
                                    disabled={actionLoading || phoneNumber.length !== 14}
                                    size="sm"
                                    className="flex-shrink-0"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="kipo-icon-sm mr-2 animate-spin" />
                                    ) : (
                                        <LinkIcon className="kipo-icon-sm mr-2" />
                                    )}
                                    <span className="hidden sm:inline">Generar código</span>
                                    <span className="sm:hidden">Generar</span>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                El prefijo +521 se agrega automáticamente para números mexicanos
                            </p>
                        </div>

                        {verificationCode && codeExpiresAt && (
                            <InfoBanner variant="info" title="Paso 2: Envía este mensaje a WhatsApp">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border font-mono text-base font-medium">
                                        <span className="text-primary">LINK</span>
                                        <span>{verificationCode}</span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Smartphone className="h-3 w-3" />
                                            <span>Envía ese mensaje al número de Twilio:</span>
                                        </div>
                                        <div className="font-mono font-medium">+1 415 523 8886</div>
                                        <div className="flex items-center gap-1 text-amber-700">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatExpirationTime(codeExpiresAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </InfoBanner>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}