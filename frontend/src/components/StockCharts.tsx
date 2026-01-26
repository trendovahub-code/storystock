"use client"

import * as React from "react"
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const mockPriceData = [
    { date: "Oct", price: 3400 },
    { date: "Nov", price: 3550 },
    { date: "Dec", price: 3480 },
    { date: "Jan", price: 3720 },
    { date: "Feb", price: 3842 },
]

const mockFinancialData = [
    { year: "2020", revenue: 156949, profit: 32340 },
    { year: "2021", revenue: 164177, profit: 32430 },
    { year: "2022", revenue: 191754, profit: 38327 },
    { year: "2023", revenue: 225333, profit: 42147 },
    { year: "2024", revenue: 245000, profit: 46000 },
]

interface DataPoint {
    date?: string;
    year?: string;
    price?: number;
    close?: number;
    revenue?: number;
    profit?: number;
    volume?: number;
}

export function PriceChart({ data }: { data?: DataPoint[] }) {
    const chartData = data && data.length > 0 ? data : mockPriceData
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        dy={10}
                        interval="preserveStartEnd"
                        minTickGap={30}
                    />
                    <YAxis
                        hide={true}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: string | number | undefined) => {
                            if (value === undefined) return ["N/A", "Price"];
                            return [`₹${value}`, 'Price'];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke="var(--color-primary-500)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export function FinancialsChart({ data }: { data?: DataPoint[] }) {
    const chartData = data && data.length > 0 ? data : mockFinancialData
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Bar dataKey="revenue" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="profit" fill="var(--color-success-500)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
