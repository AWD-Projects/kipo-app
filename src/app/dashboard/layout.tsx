"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    LogOut,
    DollarSign,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoadingState } from "@/components/ui/loading-state";
import { ReactNode } from "react";
import { useUser } from "@/hooks/useUser";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading, router, supabase } = useUser();
    const pathname = usePathname();

    // Register service worker for push notifications
    useServiceWorker();

    // Redirect if not authenticated
    if (!loading && !user) {
        router.push('/login');
        return null;
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return <PageLoadingState message="Cargando tu dashboard..." />;
    }

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
            name: "Transacciones",
            href: "/dashboard/transactions",
            icon: <DollarSign className="h-5 w-5" />,
        },
        {
            name: "Tarjetas",
            href: "/dashboard/cards",
            icon: <CreditCard className="h-5 w-5" />,
        },
        {
            name: "Configuración",
            href: "/dashboard/settings",
            icon: <Settings className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Header with safe area */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-card border-b safe-area-top">
                <Link href="/" className="flex items-center">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="h-10 w-auto"
                    />
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={handleSignOut}
                >
                    <LogOut className="kipo-icon-sm" />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                </Button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
                    <nav className="flex-1 px-3 py-6 space-y-1">
                        {navItems.map(({ name, href, icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    pathname === href
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }`}
                            >
                                {icon}
                                {name}
                            </Link>
                        ))}
                    </nav>
                    <div className="p-3 border-t">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                    src="/icons/avatar/kipo.png"
                                    alt="User Avatar"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 object-contain"
                                />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-medium text-sm truncate">
                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content - proper mobile spacing */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden lg:pb-0" style={{
                    paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))'
                }}>
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation with safe area */}
            <nav className="fixed bottom-0 inset-x-0 lg:hidden bg-card border-t z-50" style={{
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                <div className="flex justify-around items-center h-16">
                    {navItems.map(({ name, href, icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-2 transition-colors ${
                                pathname === href
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {icon}
                            <span className="text-xs font-medium truncate px-1">{name.split(' ')[0]}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}