"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    ArrowRight,
    LineChart,
    Shield,
    Gift,
    Sparkles,
    Zap,
    Cpu,
    Layers,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div className="flex flex-col">
            {/* Header */}
            <header
                className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
                    scrolled ? "bg-background shadow-sm" : "bg-transparent"
                }`}
            >
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="text-2xl font-bold text-primary">Kipo</div>
                    <div className="flex space-x-3">
                        <Link href="/login">
                            <Button variant="ghost" className="text-sm">
                                Iniciar sesión
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="default" className="text-sm">
                                Crear cuenta
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero - Con SVG de fondo */}
            <section className="min-h-screen flex flex-col justify-center py-28 text-center bg-primary/5 relative overflow-hidden">
                {/* SVG de fondo */}
                <div className="absolute inset-0 w-full h-full z-0 opacity-10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="none"
                        viewBox="0 0 1440 560"
                    >
                        <g mask='url("#SvgjsMask1002")' fill="none">
                            <path
                                d="M248.71 0C271.99 39.71 211.99 77.74 222.07 140C227.64 174.4 248.86 169.38 280 193.33C339.87 239.38 349.3 230.86 404.09 280C419.3 293.64 410.7 318.89 420 318.89C429.95 318.89 436.07 301.33 442.58 280C463.38 211.88 481.5 205.28 474.63 140C470.21 97.95 449.17 101.15 420 65.33C392.16 31.15 360.61 19.53 360.61 0C360.61 -13.14 390.31 0 420 0C481.25 0 482.47 -4.45 542.5 0C552.47 0.74 553.69 2.49 560 10.37C609.74 72.49 602 80.96 654.59 140C672 159.54 677.92 167.54 700 167.54C719.29 167.54 725.8 159.48 737.33 140C775.38 75.71 758.65 55.26 799.17 0C809.98 -14.74 819.59 0 840 0C858.15 0 859.02 -4.8 876.3 0C929.02 14.64 933.27 38.89 980 38.89C1001.4 38.89 990.11 6.24 1012.56 0C1060.11 -13.21 1066.28 0 1120 0C1186 0 1238.73 -31.84 1252 0C1267.9 38.16 1175.76 84.68 1178.33 140C1179.76 170.66 1217.54 162.29 1260 171.96C1328.37 187.53 1337.23 201.24 1400 190.49C1430.56 185.26 1445.56 170.56 1446.67 140C1449.01 75.31 1382.52 36.56 1406.89 0C1429.18 -33.44 1507.56 -34.12 1540 0C1574.12 35.88 1540 70 1540 140C1540 210 1540 210 1540 280C1540 350 1540 350 1540 420C1540 490 1575 525 1540 560C1505 595 1470 560 1400 560C1330 560 1330 560 1260 560C1190 560 1190 560 1120 560C1050 560 1050 560 980 560C910 560 910 560 840 560C770 560 770 560 700 560C630 560 630 560 560 560C490 560 490 560 420 560C350 560 350 560 280 560C210 560 210 560 140 560C95.45 560 94.86 564.4 50.91 560C24.86 557.4 7.52 566.67 0 546C-17.94 496.67 0 483 0 420C0 350 0 350 0 280C0 210 0 210 0 140C0 70 -35 35 0 0C35 -35 70 0 140 0C194.36 0 230.95 -30.29 248.71 0"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M980 244C961.61 244 951.89 257.6 948.5 280C938.56 345.6 941.68 352.89 953.33 420C957.43 443.63 961.61 461.48 980 461.48C1011.07 461.48 1041.61 453.73 1052.26 420C1070.25 362.99 1061.68 339.44 1037.27 280C1025.55 251.44 1006 244 980 244"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M280 375.79C259.52 375.79 249.64 395 249.64 420C249.64 483.42 253.95 552.63 280 552.63C309.78 552.63 361.29 475.44 361.29 420C361.29 387.02 315.34 375.79 280 375.79"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1260 390.44C1222.95 390.44 1181.76 400.77 1181.76 420C1181.76 441.63 1225.25 472.16 1260 472.16C1284.22 472.16 1299.7 443.28 1299.7 420C1299.7 402.42 1281.92 390.44 1260 390.44"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M207.53 0C214.98 48 186.32 70.64 161.72 140C152.55 165.84 154.93 167.61 140 190.4C109.07 237.61 70 242.08 70 280C70 306.88 112.46 291.96 140 320C181.2 361.96 207.47 369.28 207.47 420C207.47 474.18 189.23 510.28 140 529.8C85.49 551.41 44.4 537.08 0 502.25C-25.6 482.18 0 461.13 0 420C0 350 0 350 0 280C0 210 0 210 0 140C0 70 -35 35 0 0C35 -35 70 0 140 0C173.76 0 204.12 -22 207.53 0"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M815.11 140C833.17 123.48 818.42 103.79 840 96.92C900.86 77.54 921.2 114.22 980 87.5C1027.83 65.76 1009.09 27.61 1053.26 0C1079.09 -16.14 1086.63 0 1120 0C1161 0 1202 -20.86 1202 0C1202 35.42 1164.86 60.14 1120 112.55C1104.94 130.14 1102.32 128.27 1082.16 140C1032.32 168.99 1024.6 158.81 980 194C935.89 228.81 920.09 229.25 904.75 280C885.93 342.25 891.88 355.24 911.67 420C929.51 478.39 940.08 478.74 980 526.3C998.84 548.74 1029.19 550.77 1029.19 560C1029.19 567.62 1004.6 560 980 560C936.66 560 935.36 566.59 893.33 560C865.36 555.61 868.19 540.59 840 538.04C771.53 531.84 765.31 532.87 700 542.5C690.84 543.85 700.19 558.86 691.06 560C630.19 567.61 625.53 560 560 560C511.11 560 481.67 588.78 462.22 560C434.37 518.78 444.11 483.96 465.41 420C490.74 343.96 529.8 356.03 555.48 280C577.09 216.03 526.68 152.7 560 140C598.94 125.16 631.92 224.92 700 224.92C759.47 224.92 763.17 187.48 815.11 140"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1499.7 140C1515.63 78.56 1451.04 45.92 1464.26 0C1471.19 -24.08 1526.7 -24.57 1540 0C1564.57 45.43 1540 70 1540 140C1540 210 1540 210 1540 280C1540 350 1540 350 1540 420C1540 490 1575 525 1540 560C1505 595 1470 560 1400 560C1330 560 1330 560 1260 560C1244.2 560 1228.39 564.43 1228.39 560C1228.39 554.82 1247.89 554.5 1260 540.78C1309.67 484.5 1351.94 473.91 1351.94 420C1351.94 379.3 1309.88 378.93 1260 351.56C1193.91 315.3 1185.9 325.66 1120 292.73C1114.31 289.88 1116.82 286.37 1116.82 280C1116.82 273.63 1114.29 270.06 1120 267.27C1185.88 235.06 1188.53 214.95 1260 210C1328.53 205.25 1340.46 265.26 1400 247.87C1460.31 230.26 1483.5 202.49 1499.7 140"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M214.67 280C214.67 263.79 248.62 248.89 280 248.89C303.56 248.89 324.55 263.91 324.55 280C324.55 296.66 303.76 314.39 280 314.39C248.82 314.39 214.67 296.54 214.67 280"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M140 70C85.09 80.27 57.66 59.94 0 31.11C-12.34 24.94 -12.73 2.83 0 0C57.27 -12.73 70 0 140 0C153.18 0 166.35 -9.12 166.35 0C166.35 25.88 168.27 64.71 140 70"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M965.26 140C965.26 138.03 972.84 136.11 980 136.11C984 136.11 987.57 138.03 987.57 140C987.57 141.98 984.01 144 980 144C972.85 144 965.26 141.97 965.26 140"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1120 43.92C1105.94 43.92 1093.95 14.54 1093.95 0C1093.95 -7.42 1106.97 0 1120 0C1136 0 1152 -8.14 1152 0C1152 13.82 1134.96 43.92 1120 43.92"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1540 80C1535.35 80 1521.64 32.69 1521.64 0C1521.64 -7.31 1538.29 -7.47 1540 0C1547.47 32.53 1544.53 80 1540 80"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M710.77 280C739.49 230.37 787.66 222.07 840 222.07C862.77 222.07 856.42 249.8 861 280C871.42 348.76 877.44 352.93 870 420C866.94 447.64 862.89 469.41 840 469.41C790.61 469.41 755.81 464.5 725.45 420C691.19 369.79 682.22 329.33 710.77 280"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1194.67 280C1194.67 263.88 1226.37 248.04 1260 248.04C1304.98 248.04 1351.88 263.86 1351.88 280C1351.88 296.18 1304.94 312.67 1260 312.67C1226.34 312.67 1194.67 296.19 1194.67 280"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1502.67 280C1502.67 254.15 1529.81 224 1540 224C1548.48 224 1540 252 1540 280C1540 297.5 1547.58 315 1540 315C1528.92 315 1502.67 299.65 1502.67 280"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M0 320.65C42.45 309.28 76.21 344.16 140 382.5C158.86 393.83 165.3 400.98 165.3 420C165.3 440.32 161.21 456.24 140 461.18C78.56 475.49 54.9 474.65 0 458.5C-15.1 454.06 0 439.25 0 420C0 370.33 -27.55 328.03 0 320.65"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M517.78 560C517.78 505.68 535.69 420 560 420C585.1 420 616.6 509.08 616.6 560C616.6 579.08 588.3 560 560 560C538.89 560 517.78 575.68 517.78 560"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                            <path
                                d="M1472.59 560C1472.59 538.33 1520.56 487.2 1540 487.2C1554.26 487.2 1557.5 541.1 1540 560C1523.8 577.5 1472.59 574.73 1472.59 560"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="2"
                            ></path>
                        </g>
                        <defs>
                            <mask id="SvgjsMask1002">
                                <rect
                                    width="1440"
                                    height="560"
                                    fill="#ffffff"
                                ></rect>
                            </mask>
                        </defs>
                    </svg>
                </div>

                {/* Contenido con posición relativa para que aparezca por encima del SVG */}
                <div className="container mx-auto space-y-8 px-4 relative z-10">
                    <h2 className="text-6xl font-medium tracking-tight text-primary">
                        Domina tus finanzas con{" "}
                        <span className="text-primary">Kipo</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Control de gastos, metas de ahorro y recomendaciones
                        personalizadas impulsadas por Inteligencia Artificial.
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="gap-2 bg-primary hover:bg-primary/90"
                            >
                                Comenzar ahora{" "}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button
                                size="lg"
                                variant="outline"
                                className="text-primary border-primary/20 hover:bg-primary/5"
                            >
                                Ver características
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section
                id="features"
                className="py-24 container mx-auto space-y-16 px-4"
            >
                <div className="text-center space-y-6">
                    <h3 className="text-2xl font-medium text-primary">
                        Todo en un solo lugar
                    </h3>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Registra ingresos y gastos automáticamente, fija
                        presupuestos y metas, y visualiza tu progreso con
                        gráficos claros.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="border-0 shadow-sm hover:border-l-2 hover:border-l-primary transition-all">
                        <CardHeader className="flex items-start">
                            <div className="mb-4">
                                <LineChart className="text-primary h-5 w-5" />
                            </div>
                            <CardTitle className="text-base font-medium">
                                Seguimiento Inteligente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground text-sm pt-0">
                            Sincroniza con tu cuenta bancaria y ve tus
                            transacciones clasificadas automáticamente en
                            categorías.
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:border-l-2 hover:border-l-primary transition-all">
                        <CardHeader className="flex items-start">
                            <div className="mb-4">
                                <Shield className="text-primary h-5 w-5" />
                            </div>
                            <CardTitle className="text-base font-medium">
                                Metas Personalizadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground text-sm pt-0">
                            Define objetivos de ahorro (vacaciones, fondo de
                            emergencia…) y recibe alertas cuando estés cerca de
                            alcanzarlos.
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:border-l-2 hover:border-l-primary transition-all">
                        <CardHeader className="flex items-start">
                            <div className="mb-4">
                                <Gift className="text-primary h-5 w-5" />
                            </div>
                            <CardTitle className="text-base font-medium">
                                Recomendaciones en tu bolsillo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground text-sm pt-0">
                            Consejos de ahorro y gestión de deudas ajustados a
                            tus hábitos y estilo de vida.
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* AI-Powered - Fondo blanco, más minimalista */}
            <section id="ai" className="py-24 bg-primary/5">
                <div className="container mx-auto space-y-16 px-4">
                    <div className="text-center space-y-6">
                        <h3 className="text-2xl font-medium text-primary flex items-center justify-center">
                            Impulsado por IA <Sparkles />
                        </h3>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Nuestras herramientas de IA hacen el trabajo duro
                            por ti, para que te concentres en lo que importa.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="border-0 bg-primary text-white shadow-sm hover:border-l-2 hover:border-l-white/50 transition-all relative overflow-hidden">
                            {/* SVG de fondo para cada card */}
                            <div className="absolute inset-0 w-full h-full z-0 opacity-30">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    version="1.1"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    width="100%"
                                    height="100%"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 1440 560"
                                >
                                    <g mask='url("#SvgjsMask1002")' fill="none">
                                        <path
                                            d="M629.68 629.8C778.8 619.96 886.49 337.25 1150.63 336.64 1414.78 336.03 1538.08 453.51 1671.59 454.24"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                        <path
                                            d="M393.89 571.57C581.19 527.1 654.23 28.17 936.41 25.11 1218.59 22.05 1331.19 255.32 1478.93 260.31"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                        <path
                                            d="M118.94 624.31C305.39 621.87 457.47 411.22 832.03 405.59 1206.58 399.96 1356.98 168.01 1545.11 164.79"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                    </g>
                                    <defs>
                                        <mask id="SvgjsMask1002">
                                            <rect
                                                width="1440"
                                                height="560"
                                                fill="#ffffff"
                                            ></rect>
                                        </mask>
                                    </defs>
                                </svg>
                            </div>
                            <CardHeader className="flex items-start relative z-10">
                                <div className="mb-4">
                                    <Zap className="text-white h-5 w-5" />
                                </div>
                                <CardTitle className="text-base font-medium text-white">
                                    Plan de Ahorro Sugerido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-white text-sm pt-0 relative z-10">
                                Basado en tu historial de gastos, la IA te
                                propone un plan de aportes para alcanzar tu
                                meta.
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-primary text-white shadow-sm hover:border-l-2 hover:border-l-white/50 transition-all relative overflow-hidden">
                            {/* SVG de fondo para cada card */}
                            <div className="absolute inset-0 w-full h-full z-0 opacity-30">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    version="1.1"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    width="100%"
                                    height="100%"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 1440 560"
                                >
                                    <g mask='url("#SvgjsMask1002")' fill="none">
                                        <path
                                            d="M623.09 613.69C775.07 582.52 844.41 191.26 1076.57 190.08 1308.73 188.9 1403.75 408.08 1530.05 414.08"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                        <path
                                            d="M96.86 632.85C227.4 624.9 322.17 383.4 556.24 382.55 790.3 381.7 785.93 452.55 1015.61 452.55 1245.3 452.55 1358.82 382.75 1474.99 382.55"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                    </g>
                                    <defs>
                                        <mask id="SvgjsMask1002">
                                            <rect
                                                width="1440"
                                                height="560"
                                                fill="#ffffff"
                                            ></rect>
                                        </mask>
                                    </defs>
                                </svg>
                            </div>
                            <CardHeader className="flex items-start relative z-10">
                                <div className="mb-4">
                                    <Cpu className="text-white h-5 w-5" />
                                </div>
                                <CardTitle className="text-base font-medium text-white">
                                    Clasificación Automática
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-white text-sm pt-0 relative z-10">
                                Cada compra se etiqueta al instante:
                                restaurantes, transporte, salud... Olvida el
                                trabajo manual.
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-primary text-white shadow-sm hover:border-l-2 hover:border-l-white/50 transition-all relative overflow-hidden">
                            {/* SVG de fondo para cada card */}
                            <div className="absolute inset-0 w-full h-full z-0 opacity-30">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    version="1.1"
                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                    width="100%"
                                    height="100%"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 1440 560"
                                >
                                    <g mask='url("#SvgjsMask1002")' fill="none">
                                        <path
                                            d="M393.89 571.57C581.19 527.1 654.23 28.17 936.41 25.11 1218.59 22.05 1331.19 255.32 1478.93 260.31"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                        <path
                                            d="M629.68 629.8C778.8 619.96 886.49 337.25 1150.63 336.64 1414.78 336.03 1538.08 453.51 1671.59 454.24"
                                            stroke="rgba(255, 255, 255, 1)"
                                            strokeWidth="10"
                                        ></path>
                                    </g>
                                    <defs>
                                        <mask id="SvgjsMask1002">
                                            <rect
                                                width="1440"
                                                height="560"
                                                fill="#ffffff"
                                            ></rect>
                                        </mask>
                                    </defs>
                                </svg>
                            </div>
                            <CardHeader className="flex items-start relative z-10">
                                <div className="mb-4">
                                    <Layers className="text-white h-5 w-5" />
                                </div>
                                <CardTitle className="text-base font-medium text-white">
                                    Recomendaciones Dinámicas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-white text-sm pt-0 relative z-10">
                                La IA analiza tu flujo de caja y te sugiere
                                ajustes inmediatos para optimizar tus finanzas.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Final - Minimalista */}
            <section className="py-32 bg-primary/5 text-center relative overflow-hidden">
                {/* SVG de fondo */}
                <div className="absolute inset-0 w-full h-full z-0 opacity-10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="none"
                        viewBox="0 0 1440 560"
                    >
                        <g mask="url(#SvgjsMask1002)" fill="none">
                            <path
                                d="M -430.32017556728374,424 C -334.32,361 -142.32,117 49.679824432716266,109 C 241.68,101 337.68,364 529.6798244327163,384 C 721.68,404 817.68,216.4 1009.6798244327163,209 C 1201.68,201.6 1403.62,371 1489.6798244327163,347 C 1575.74,323 1449.94,140.6 1440,89"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="5"
                            ></path>
                            <path
                                d="M -723.0722281851688,435 C -627.07,389 -435.07,219.2 -243.07222818516877,205 C -51.07,190.8 44.93,377.4 236.92777181483123,364 C 428.93,350.6 524.93,114.2 716.9277718148312,138 C 908.93,161.8 1052.31,481.8 1196.9277718148312,483 C 1341.54,484.2 1391.39,211.8 1440,144"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="5"
                            ></path>
                            <path
                                d="M -85.16368007822484,317 C 10.84,269.8 202.84,85.6 394.83631992177516,81 C 586.84,76.4 682.84,281.8 874.8363199217752,294 C 1066.84,306.2 1162.84,135.2 1354.8363199217752,142 C 1546.84,148.8 1817.8,332.4 1834.8363199217752,328 C 1851.87,323.6 1518.97,161.6 1440,120"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="5"
                            ></path>
                            <path
                                d="M -274.45402494467555,237 C -178.45,259.2 13.55,368 205.54597505532442,348 C 397.55,328 493.55,123 685.5459750553244,137 C 877.55,151 973.55,405.6 1165.5459750553243,418 C 1357.55,430.4 1590.66,222.4 1645.5459750553243,199 C 1700.44,175.6 1481.11,280.6 1440,301"
                                stroke="rgba(51, 51, 51, 1)"
                                strokeWidth="5"
                            ></path>
                        </g>
                        <defs>
                            <mask id="SvgjsMask1002">
                                <rect
                                    width="1440"
                                    height="560"
                                    fill="#ffffff"
                                ></rect>
                            </mask>
                        </defs>
                    </svg>
                </div>

                {/* Contenido */}
                <div className="container mx-auto max-w-2xl space-y-12 px-4 relative z-10">
                    <div className="space-y-6">
                        <h3 className="text-3xl font-medium text-primary">
                            ¿Listo para transformar tu futuro financiero?
                        </h3>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Comienza ahora y lleva el control de tus finanzas al
                            siguiente nivel con recomendaciones personalizadas.
                        </p>
                    </div>

                    <div className="flex justify-center items-center space-x-4">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="gap-2 bg-primary hover:bg-primary/90"
                            >
                                Crear cuenta gratuita
                            </Button>
                        </Link>
                    </div>

                    <div className="flex justify-center items-center text-xs text-muted-foreground">
                        <p>
                            Sin tarjeta de crédito • Cancelación en cualquier
                            momento
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-background pb-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center gap-2 text-xs flex-wrap">
                        <span className="text-muted-foreground">
                            © {new Date().getFullYear()} Kipo. Todos los
                            derechos reservados.
                        </span>
                        <span className="text-muted-foreground mx-1">—</span>
                        <Link
                            href="https://www.amoxtli.tech"
                            target="_blank"
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            Powered by Amoxtli Web Developers
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}