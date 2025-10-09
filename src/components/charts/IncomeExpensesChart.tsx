"use client";

import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatCurrency } from "@/lib/format";

interface Transaction {
    type: "income" | "expense";
    amount: number;
    transaction_date: string;
}

interface IncomeExpensesChartProps {
    transactions: Transaction[];
}

export function IncomeExpensesChart({ transactions }: IncomeExpensesChartProps) {
    const chartOptions = useMemo(() => {
        // Group transactions by date
        const groupedByDate = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.transaction_date);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

            if (!acc[dateKey]) {
                acc[dateKey] = { date: date.getTime(), income: 0, expenses: 0 };
            }

            if (transaction.type === "income") {
                acc[dateKey].income += transaction.amount;
            } else {
                acc[dateKey].expenses += transaction.amount;
            }

            return acc;
        }, {} as Record<string, { date: number; income: number; expenses: number }>);

        // Convert to array and sort by date
        const sortedData = Object.values(groupedByDate)
            .sort((a, b) => a.date - b.date)
            .slice(-14); // Last 14 days/entries

        if (sortedData.length === 0) {
            return null;
        }

        const incomeData = sortedData.map(d => [d.date, d.income]);
        const expensesData = sortedData.map(d => [d.date, d.expenses]);

        return {
            chart: {
                type: 'areaspline',
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
            xAxis: {
                type: 'datetime',
                labels: {
                    format: '{value:%d %b}',
                    style: {
                        fontSize: '12px',
                    },
                },
                gridLineWidth: 0,
            },
            yAxis: {
                title: {
                    text: undefined,
                },
                labels: {
                    formatter: function(this: any) {
                        return this.value >= 1000 ? `$${(this.value / 1000).toFixed(1)}k` : `$${this.value}`;
                    },
                    style: {
                        fontSize: '12px',
                    },
                },
                gridLineWidth: 1,
                gridLineDashStyle: 'Dash',
            },
            tooltip: {
                shared: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                borderWidth: 1,
                shadow: true,
                useHTML: true,
                formatter: function(this: any) {
                    const date = Highcharts.dateFormat('%d %b %Y', this.x);
                    const income = this.points[0].y;
                    const expenses = this.points[1].y;
                    const balance = income - expenses;

                    return `
                        <div style="padding: 4px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">${date}</div>
                            <div style="color: #10b981; font-size: 12px; margin-bottom: 4px;">
                                Ingresos: ${formatCurrency(income)}
                            </div>
                            <div style="color: #ef4444; font-size: 12px; margin-bottom: 4px;">
                                Gastos: ${formatCurrency(expenses)}
                            </div>
                            <div style="border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 4px; font-size: 12px; color: #6b7280;">
                                Balance: ${formatCurrency(balance)}
                            </div>
                        </div>
                    `;
                },
            },
            plotOptions: {
                areaspline: {
                    fillOpacity: 0.3,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true,
                                radius: 5,
                            },
                        },
                    },
                    lineWidth: 2,
                    states: {
                        hover: {
                            lineWidth: 3,
                        },
                    },
                },
            },
            series: [
                {
                    name: 'Ingresos',
                    data: incomeData,
                    color: '#10b981',
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, 'rgba(16, 185, 129, 0.3)'],
                            [1, 'rgba(16, 185, 129, 0)'],
                        ],
                    },
                },
                {
                    name: 'Gastos',
                    data: expensesData,
                    color: '#ef4444',
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, 'rgba(239, 68, 68, 0.3)'],
                            [1, 'rgba(239, 68, 68, 0)'],
                        ],
                    },
                },
            ],
            legend: {
                enabled: true,
                align: 'center',
                verticalAlign: 'bottom',
                itemStyle: {
                    fontSize: '12px',
                    fontWeight: 'normal',
                },
            },
            responsive: {
                rules: [
                    {
                        condition: {
                            maxWidth: 500,
                        },
                        chartOptions: {
                            legend: {
                                enabled: true,
                                itemStyle: {
                                    fontSize: '11px',
                                },
                            },
                            xAxis: {
                                labels: {
                                    style: {
                                        fontSize: '10px',
                                    },
                                },
                            },
                            yAxis: {
                                labels: {
                                    style: {
                                        fontSize: '10px',
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
                <p className="text-sm">No hay datos para mostrar</p>
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
