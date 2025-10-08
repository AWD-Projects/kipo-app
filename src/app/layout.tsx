import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { RegisterServiceWorker } from "./register-sw";

// Carga Quicksand con pesos que necesites
const fontQuicksand = Quicksand({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: {
        default: "Kipo",
        template: "%s | Kipo – Finanzas Personales",
    },
    description:
        "Kipo te ayuda a controlar gastos, establecer metas de ahorro y recibir recomendaciones inteligentes basadas en IA. Gestiona tu dinero de forma sencilla, segura y visual.",
    icons: {
        icon: "/favicon.png",
        apple: "/icons/icon-192x192.png",
    },
    keywords: [
        "finanzas personales",
        "ahorro",
        "control de gastos",
        "metas de ahorro",
        "gestión financiera",
        "inteligencia artificial",
        "dashboard financiero",
        "Kipo",
    ],
    authors: [
        { name: "Amoxtli Web Developers", url: "https://www.amoxtli.tech" },
    ],
    creator: "Amoxtli Web Developers",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Kipo",
    },
    applicationName: "Kipo",
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1.0,
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
                <RegisterServiceWorker />
                {children}
                <Toaster />
            </body>
        </html>
    );
}
