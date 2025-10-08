import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { RegisterServiceWorker } from "./register-sw";
import { StructuredData } from "@/components/StructuredData";

// Carga Quicksand con pesos que necesites
const fontQuicksand = Quicksand({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    metadataBase: new URL('https://kipo.app'),
    title: {
        default: "Kipo - Controla tus Finanzas Personales con WhatsApp e IA | App Gratis",
        template: "%s | Kipo - Finanzas Personales",
    },
    description:
        "Gestiona tu dinero sin complicaciones con Kipo. Registra gastos por WhatsApp, recibe recordatorios de pagos automáticos y evita intereses. App web gratuita con IA. Ahorra tiempo y dinero. ¡Pruébala gratis!",
    keywords: [
        // Core features
        "app finanzas personales gratis",
        "control de gastos whatsapp",
        "app ahorro dinero",
        "recordatorios pago tarjetas",
        "evitar intereses tarjeta credito",
        "registrar gastos whatsapp",

        // Location-based
        "app finanzas mexico",
        "control gastos mexico",
        "app ahorro pesos mexicanos",

        // Problem-solving
        "como ahorrar dinero",
        "como controlar gastos",
        "app recordatorios pagos",
        "organizar finanzas personales",
        "reducir gastos hormiga",

        // Technology
        "app finanzas inteligencia artificial",
        "chatbot finanzas whatsapp",
        "pwa finanzas",
        "app web finanzas",

        // Comparison
        "mejor app finanzas personales",
        "alternativa mint mexico",
        "app finanzas facil usar",

        // Long-tail
        "como llevar control de gastos diarios",
        "app para no olvidar pagar tarjeta",
        "registrar gastos rapido",
        "control finanzas sin complicaciones",
    ],
    authors: [
        { name: "Amoxtli Web Developers", url: "https://www.amoxtli.tech" },
    ],
    creator: "Amoxtli Web Developers",
    publisher: "Kipo by Amoxtli",

    // Open Graph
    openGraph: {
        type: 'website',
        locale: 'es_MX',
        url: 'https://kipo.app',
        title: 'Kipo - Controla tus Finanzas con WhatsApp | Gratis',
        description: 'Registra gastos por WhatsApp, recibe recordatorios automáticos y evita intereses. App de finanzas personales gratis con IA. Ahorra $800/año en promedio.',
        siteName: 'Kipo',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Kipo - App de Finanzas Personales',
            }
        ],
    },

    // Twitter Card
    twitter: {
        card: 'summary_large_image',
        title: 'Kipo - Finanzas Personales con WhatsApp',
        description: 'Controla gastos por WhatsApp. Recordatorios automáticos. Evita intereses. Gratis.',
        images: ['/twitter-image.png'],
        creator: '@kipo_app',
    },

    // Additional metadata
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },

    icons: {
        icon: "/favicon.png",
        apple: "/icons/icon-192x192.png",
        shortcut: "/favicon.png",
    },

    manifest: "/manifest.json",

    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Kipo - Finanzas",
    },

    applicationName: "Kipo",

    formatDetection: {
        telephone: false,
    },

    category: 'finance',

    alternates: {
        canonical: 'https://kipo.app',
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1.0,
    viewportFit: "cover", // Enable safe-area-inset for notch/home indicator
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#333333" },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className="light">
            <head />
            <body
                className={cn(
                    // Aplica la variable CSS de Quicksand globalmente
                    "min-h-screen bg-background antialiased",
                    fontQuicksand.variable,
                    "font-sans"
                )}
            >
                <StructuredData />
                <RegisterServiceWorker />
                {children}
                <Toaster />
            </body>
        </html>
    );
}
