'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function InsightsChart({ receipts }) {
    if (!receipts || receipts.length === 0) return null;

    // Aggregate data by category
    const dataMap = (receipts || []).reduce((acc, curr) => {
        const category = curr.category || 'Uncategorized';
        const amount = typeof curr.total === 'number' ? curr.total : parseFloat(curr.total || 0);

        if (!isNaN(amount)) {
            acc[category] = (acc[category] || 0) + amount;
        }
        return acc;
    }, {});

    const data = Object.keys(dataMap).map(key => ({
        name: key,
        value: dataMap[key]
    })).sort((a, b) => b.value - a.value);

    if (data.length === 0) return null;

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Spending Insights</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderRadius: '8px', color: 'var(--foreground)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            formatter={(value) => `₹${value.toFixed(2)}`}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1rem' }}>
                {data.slice(0, 3).map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--card-border)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></span>
                            {item.name}
                        </span>
                        <span style={{ fontWeight: 600 }}>₹{item.value.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
