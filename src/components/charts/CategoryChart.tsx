"use client";

import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCurrency } from "@/lib/format";

interface Transaction {
    category: string;
    amount: number;
    type: "income" | "expense";
}

interface CategoryChartProps {
    transactions: Transaction[];
}

const COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
    "#84cc16", // lime
];

export function CategoryChart({ transactions }: CategoryChartProps) {
    const chartOptions = useMemo(() => {
        // Filter only expenses for category breakdown
        const expenses = transactions.filter(t => t.type === "expense");

        // Group by category
        const groupedByCategory = expenses.reduce((acc, transaction) => {
            const category = transaction.category || "Sin categoría";

            if (!acc[category]) {
                acc[category] = { name: category, y: 0 };
            }

            acc[category].y += transaction.amount;

            return acc;
        }, {} as Record<string, { name: string; y: number }>);

        // Convert to array and sort by value (descending)
        const chartData = Object.values(groupedByCategory)
            .sort((a, b) => b.y - a.y)
            .slice(0, 10) // Top 10 categories
            .map((item, index) => ({
                name: item.name,
                y: item.y,
                color: COLORS[index % COLORS.length],
            }));

        if (chartData.length === 0) {
            return null;
        }

        const total = chartData.reduce((sum, item) => sum + item.y, 0);

        return {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: 'inherit',
                },
                height: 300,
            },
            title: {
                text: undefined,
            },
            credits: {
                enabled: false,
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                borderWidth: 1,
                shadow: true,
                useHTML: true,
                formatter: function(this: any) {
                    const percentage = ((this.y / total) * 100).toFixed(1);
                    return `
                        <div style="padding: 4px;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${this.point.name}</div>
                            <div style="color: #6366f1; font-size: 12px; margin-bottom: 2px;">
                                ${formatCurrency(this.y)}
                            </div>
                            <div style="font-size: 11px; color: #6b7280;">
                                ${percentage}% del total
                            </div>
                        </div>
                    `;
                },
            },
            plotOptions: {
                pie: {
                    innerSize: '60%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        distance: 15, // Distance from the arc (positive = outside)
                        connectorWidth: 1,
                        connectorColor: 'rgba(128, 128, 128, 0.5)',
                        connectorPadding: 5,
                        formatter: function(this: any) {
                            const percentage = ((this.y / total) * 100);
                            // Only show label if percentage is greater than 3%
                            if (percentage < 3) return null;
                            return `<b>${this.point.name}</b><br/>${percentage.toFixed(1)}%`;
                        },
                        style: {
                            fontSize: '11px',
                            fontWeight: 'normal',
                            textOutline: 'none',
                        },
                    },
                    showInLegend: true,
                    states: {
                        hover: {
                            brightness: 0.1,
                        },
                    },
                },
            },
            series: [
                {
                    name: 'Gastos',
                    type: 'pie',
                    data: chartData,
                },
            ],
            legend: {
                enabled: true,
                align: 'center',
                verticalAlign: 'bottom',
                layout: 'horizontal',
                itemStyle: {
                    fontSize: '11px',
                    fontWeight: 'normal',
                },
                labelFormatter: function(this: any) {
                    const percentage = ((this.y / total) * 100).toFixed(0);
                    return `${this.name} (${percentage}%)`;
                },
                maxHeight: 60,
            },
            responsive: {
                rules: [
                    {
                        condition: {
                            maxWidth: 500,
                        },
                        chartOptions: {
                            legend: {
                                itemStyle: {
                                    fontSize: '10px',
                                },
                                maxHeight: 50,
                            },
                            plotOptions: {
                                pie: {
                                    dataLabels: {
                                        distance: 10, // Closer on mobile
                                        style: {
                                            fontSize: '10px',
                                        },
                                        formatter: function(this: any) {
                                            const percentage = ((this.y / total) * 100);
                                            // Show fewer labels on mobile (only >5%)
                                            if (percentage < 5) return null;
                                            // Shorter format for mobile
                                            return `<b>${this.point.name}</b><br/>${percentage.toFixed(0)}%`;
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        };
    }, [transactions]);

    if (!chartOptions) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p className="text-sm">No hay gastos para mostrar</p>
            </div>
        );
    }

    return (
        <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
        />
    );
}
