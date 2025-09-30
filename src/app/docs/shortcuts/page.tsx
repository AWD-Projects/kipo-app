"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Smartphone,
    Key,
    Send,
    CheckCircle,
    Copy,
    ExternalLink,
} from "lucide-react";

export default function ShortcutsDocsPage() {
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    const apiEndpoint = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/entries`
        : 'https://tu-dominio.com/api/entries';

    const examplePayload = `{
  "type": "expense",
  "amount": 120.50,
  "category": "Comida",
  "title": "Almuerzo",
  "description": "Tacos en el trabajo",
  "transaction_date": "2024-01-15"
}`;

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
                        Configuración de iOS Shortcuts
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Aprende a configurar Shortcuts de iOS para registrar transacciones en Kipo de forma rápida y sencilla
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Prerequisites */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Requisitos previos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>iPhone o iPad con iOS 13 o superior</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>App Shortcuts instalada (viene preinstalada)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>Token de API generado en Kipo</span>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>¿No tienes un token todavía?</strong> Ve a{" "}
                                    <Link href="/dashboard/settings" className="underline">
                                        Configuración → API Keys
                                    </Link>{" "}
                                    para crear uno.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 1: Create Shortcut */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    1
                                </span>
                                Crear nuevo Shortcut
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">1</span>
                                    <span>Abre la app <strong>Shortcuts</strong> en tu iPhone</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">2</span>
                                    <span>Toca el botón <strong>&quot;+&quot;</strong> para crear un nuevo shortcut</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-center text-xs leading-6">3</span>
                                    <span>Dale un nombre como <strong>&quot;Registrar Gasto en Kipo&quot;</strong></span>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Step 2: Add Input Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    2
                                </span>
                                Agregar acciones de entrada
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Agrega estas acciones para capturar la información de la transacción:
                            </p>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">1. Solicitar entrada - Tipo de transacción</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Tipo: <strong>Lista</strong></li>
                                        <li>• Opciones: <code>Gasto</code>, <code>Ingreso</code></li>
                                        <li>• Mensaje: "¿Qué tipo de transacción?"</li>
                                    </ul>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">2. Solicitar entrada - Monto</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Tipo: <strong>Número</strong></li>
                                        <li>• Mensaje: "¿Cuánto gastaste/ingresaste?"</li>
                                    </ul>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">3. Solicitar entrada - Categoría</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Tipo: <strong>Lista</strong></li>
                                        <li>• Opciones: <code>Comida</code>, <code>Transporte</code>, <code>Entretenimiento</code>, <code>Servicios</code>, etc.</li>
                                        <li>• Mensaje: "¿En qué categoría?"</li>
                                    </ul>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">4. Solicitar entrada - Descripción</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Tipo: <strong>Texto</strong></li>
                                        <li>• Mensaje: "Descripción (opcional)"</li>
                                        <li>• Permitir respuesta vacía: <strong>Sí</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 3: Configure HTTP Request */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    3
                                </span>
                                Configurar petición HTTP
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Agrega la acción <strong>"Obtener contenido de URL"</strong> y configúrala así:
                            </p>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">URL:</Label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 p-2 bg-muted rounded text-sm">
                                            {apiEndpoint}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(apiEndpoint)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Método:</Label>
                                    <Badge>POST</Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Headers:</Label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2 text-sm">
                                            <code className="p-2 bg-muted rounded">Content-Type</code>
                                            <span>:</span>
                                            <code className="p-2 bg-muted rounded">application/json</code>
                                        </div>
                                        <div className="flex gap-2 text-sm">
                                            <code className="p-2 bg-muted rounded">Authorization</code>
                                            <span>:</span>
                                            <code className="p-2 bg-muted rounded flex-1">Bearer TU_TOKEN_AQUÍ</code>
                                        </div>
                                    </div>
                                    <p className="text-xs text-amber-600">
                                        <strong>Importante:</strong> Reemplaza <code>TU_TOKEN_AQUÍ</code> con el token completo que generaste en Kipo.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Cuerpo de la petición (JSON):</Label>
                                    <div className="relative">
                                        <pre className="p-4 bg-muted rounded text-sm overflow-x-auto">
                                            <code>{examplePayload}</code>
                                        </pre>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="absolute top-2 right-2"
                                            onClick={() => copyToClipboard(examplePayload)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        En el shortcut, reemplaza los valores con las variables capturadas en los pasos anteriores.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 4: Handle Response */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                    4
                                </span>
                                Mostrar resultado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Agrega una acción para mostrar el resultado:
                            </p>
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium mb-2">Acción: Mostrar resultado</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Agrega la acción <strong>"Mostrar resultado"</strong></li>
                                    <li>• Conecta la salida de "Obtener contenido de URL"</li>
                                    <li>• Esto mostrará si la transacción se creó exitosamente</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Consejos de uso
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Agrega al Home Screen</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Configura el shortcut para aparecer en tu pantalla de inicio para acceso rápido
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Configura Siri</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Agrega una frase de Siri como "Registrar gasto" para usar por voz
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Automatización</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Crea automatizaciones para ejecutar el shortcut en ubicaciones específicas
                                        </p>
                                    </div>
                                </div>
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
                                    <h4 className="font-medium text-amber-800 mb-2">Error: "No autorizado"</h4>
                                    <p className="text-sm text-amber-700">
                                        Verifica que hayas copiado el token completo y que esté en el header Authorization como "Bearer tu_token_aquí"
                                    </p>
                                </div>
                                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                                    <h4 className="font-medium text-red-800 mb-2">Error: "Datos inválidos"</h4>
                                    <p className="text-sm text-red-700">
                                        Revisa que el JSON esté bien formateado y que todos los campos requeridos estén presentes (type, amount, category)
                                    </p>
                                </div>
                                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">El shortcut no funciona</h4>
                                    <p className="text-sm text-blue-700">
                                        Asegúrate de que tu iPhone tenga conexión a internet y que el token no haya sido revocado
                                    </p>
                                </div>
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

// Simple Label component since we're not importing it
function Label({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any }) {
    return <label className={`text-sm font-medium ${className}`} {...props}>{children}</label>;
}