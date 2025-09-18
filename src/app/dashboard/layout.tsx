"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    LogOut,
    DollarSign,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
            
            if (!user) {
                router.push('/login');
            }
        };
        getUser();
    }, [router, supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return <Skeleton className="h-screen w-full" />;
    }

    if (!user) {
        return null;
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
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center justify-between p-4 bg-card border-b">
                <Link href="/" className="flex items-center gap-2">
                    <Image 
                        src="/logo.png" 
                        alt="Kipo Logo" 
                        width={32}
                        height={32}
                        className="h-8 w-auto"
                    />
                    <div className="text-xl font-bold text-primary">Kipo</div>
                </Link>
                <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                </Button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex flex-col w-64 border-r bg-card">
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navItems.map(({ name, href, icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                    pathname === href
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                }`}
                            >
                                {icon}
                                {name}
                            </Link>
                        ))}
                    </nav>
                    <div className="p-2">
                        <Card>
                            <div className="flex items-center p-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 overflow-hidden">
                                    <Image 
                                        src="/icons/avatar/kipo.png" 
                                        alt="User Avatar" 
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 object-contain"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </aside>

                <main className="flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-0">
                    {children}
                </main>
            </div>

            <nav className="fixed bottom-0 inset-x-0 md:hidden bg-card border-t flex justify-around py-2">
                {navItems.map(({ name, href, icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex flex-col items-center text-xs ${
                            pathname === href
                                ? "text-primary"
                                : "text-muted-foreground"
                        } hover:text-primary`}
                    >
                        {icon}
                        <span className="mt-1">{name}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}