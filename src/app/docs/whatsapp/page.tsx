"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    MessageCircle,
    Smartphone,
    CheckCircle,
    Copy,
    Link as LinkIcon,
} from "lucide-react";

export default function WhatsAppDocsPage() {
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const twilioNumber = "+1 415 523 8886";

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="mb-8">
                    <Link href="/dashboard/settings">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Configuración
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
                        Cómo vincular tu WhatsApp
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Conecta tu WhatsApp para registrar gastos e ingresos enviando mensajes de texto simples
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                ¿Qué es la vinculación de WhatsApp?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                La vinculación de WhatsApp te permite registrar transacciones enviando mensajes de texto naturales a un número de WhatsApp.
                                Nuestra inteligencia artificial extrae automáticamente el monto, la categoría y la descripción de tu mensaje.
                            </p>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>Ejemplo:</strong> Envía "Gasté 150 pesos en comida, tacos con los amigos" y Kipo creará automáticamente
                                    la transacción con toda la información.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prerequisites */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Requisitos previos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>Número de WhatsApp mexicano activo (+521 + 10 dígitos)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>WhatsApp instalado en tu dispositivo móvil</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>Cuenta activa en Kipo</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 1: Generate Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    1
                                </span>
                                Genera tu código de vinculación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">1</span>
                                    <span>Ve a <strong>Configuración → WhatsApp</strong> en tu panel de Kipo</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">2</span>
                                    <span>Ingresa tu número de WhatsApp (el prefijo <strong>+521</strong> se agrega automáticamente)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">3</span>
                                    <span>Haz clic en <strong>"Generar código"</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">4</span>
                                    <span>Recibirás un código único de 6 caracteres (ejemplo: <code className="px-2 py-1 bg-muted rounded">ABC123</code>)</span>
                                </li>
                            </ol>
                            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-800">
                                    <strong>Importante:</strong> El código expira en 10 minutos. Si expira, simplemente genera uno nuevo.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: Send Verification Message */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    2
                                </span>
                                Envía el código de verificación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Ahora debes enviar el código por WhatsApp para verificar tu número:
                            </p>
                            <ol className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">1</span>
                                    <span>Abre WhatsApp en tu teléfono</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">2</span>
                                    <div className="flex-1">
                                        <span>Inicia una conversación con el número de Kipo:</span>
                                        <div className="flex gap-2 mt-2">
                                            <code className="flex-1 p-2 bg-muted rounded font-mono font-medium">
                                                {twilioNumber}
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyToClipboard(twilioNumber)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">3</span>
                                    <div className="flex-1">
                                        <span>Envía un mensaje con el formato:</span>
                                        <div className="mt-2 p-3 bg-primary/10 rounded-lg border">
                                            <code className="font-mono font-medium">LINK TU_CODIGO</code>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Ejemplo: Si tu código es ABC123, envía: <strong>LINK ABC123</strong>
                                        </p>
                                    </div>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Step 3: Confirmation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    3
                                </span>
                                Confirmación de vinculación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Una vez enviado el mensaje:
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm">Recibirás un mensaje de confirmación en WhatsApp</p>
                                        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-sm text-green-800">
                                                "✅ WhatsApp vinculado exitosamente. ¡Ya puedes enviar transacciones!"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm">El estado en tu panel de Kipo cambiará a <strong>"Vinculado"</strong></p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* How to Use */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Cómo registrar transacciones
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Una vez vinculado, puedes enviar mensajes naturales para registrar transacciones:
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">Registrar un gasto:</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="p-2 bg-muted rounded">
                                            <code>"Gasté 250 en comida, almuerzo con cliente"</code>
                                        </div>
                                        <div className="p-2 bg-muted rounded">
                                            <code>"150 pesos de uber al aeropuerto"</code>
                                        </div>
                                        <div className="p-2 bg-muted rounded">
                                            <code>"Compré libros por 500 pesos"</code>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">Registrar un ingreso:</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="p-2 bg-muted rounded">
                                            <code>"Ingreso 5000 pesos, pago de cliente"</code>
                                        </div>
                                        <div className="p-2 bg-muted rounded">
                                            <code>"Me depositaron 1500 de freelance"</code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> La IA de Kipo es muy flexible. Escribe de forma natural y ella entenderá
                                    el monto, categoría y descripción automáticamente.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Troubleshooting */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Solución de problemas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                                    <h4 className="font-medium text-amber-800 mb-2">El código expiró</h4>
                                    <p className="text-sm text-amber-700">
                                        Los códigos expiran después de 10 minutos por seguridad. Simplemente genera un nuevo código en Configuración.
                                    </p>
                                </div>
                                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                                    <h4 className="font-medium text-red-800 mb-2">No recibo respuesta de WhatsApp</h4>
                                    <p className="text-sm text-red-700">
                                        Verifica que hayas enviado el mensaje al número correcto (+1 415 523 8886) y que tu número
                                        de WhatsApp sea el mismo que registraste en Kipo.
                                    </p>
                                </div>
                                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">Cambié de número de WhatsApp</h4>
                                    <p className="text-sm text-blue-700">
                                        Si cambiaste de número, desvincular tu número anterior en Configuración y vincular el nuevo
                                        siguiendo los mismos pasos.
                                    </p>
                                </div>
                                <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                                    <h4 className="font-medium text-purple-800 mb-2">La IA no entiende mis mensajes</h4>
                                    <p className="text-sm text-purple-700">
                                        Asegúrate de incluir el monto y una descripción básica. La IA necesita al menos estos dos elementos
                                        para crear la transacción correctamente.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy & Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="h-5 w-5" />
                                Privacidad y seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <p className="text-sm">
                                    Tu número de WhatsApp está vinculado de forma segura a tu cuenta de Kipo
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <p className="text-sm">
                                    Solo tú puedes enviar transacciones desde tu número verificado
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <p className="text-sm">
                                    Puedes desvincular tu WhatsApp en cualquier momento desde Configuración
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <p className="text-sm">
                                    Tus mensajes son procesados de forma segura y no se almacenan en Twilio
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Back to Settings */}
                    <div className="text-center pt-8">
                        <Link href="/dashboard/settings">
                            <Button>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver a Configuración
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}