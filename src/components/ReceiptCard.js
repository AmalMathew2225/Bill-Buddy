import { Calendar, Tag, Trash2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReceiptCard({ data, onChange }) {
    // Local state to manage edits before propagating up or just controlled directly
    // Since we need to update the parent's state for saving, we'll assume `data` is the source of truth
    // and `onChange` updates it. However, to keep inputs responsive, we might want local state or just callback.
    // For simplicity, we'll trigger onChange directly on blur or change.

    if (!data) return null;

    const handleFieldChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...(data.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate total if price changes (optional, but helper)
        if (field === 'price') {
            const newTotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) + (parseFloat(data.tax) || 0);
            onChange({ ...data, items: newItems, total: newTotal });
        } else {
            onChange({ ...data, items: newItems });
        }
    };

    const addItem = () => {
        const newItems = [...(data.items || []), { name: 'New Item', price: 0 }];
        onChange({ ...data, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = [...(data.items || [])];
        const removedItem = newItems.splice(index, 1)[0];
        // Adjust total
        const newTotal = (parseFloat(data.total) || 0) - (parseFloat(removedItem.price) || 0);
        onChange({ ...data, items: newItems, total: newTotal < 0 ? 0 : newTotal });
    };

    const inputStyle = {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--card-border)',
        borderRadius: '4px',
        color: 'var(--foreground)',
        padding: '2px 6px',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        width: '100%'
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Merchant</label>
                    <input
                        type="text"
                        value={data.merchant || ''}
                        onChange={(e) => handleFieldChange('merchant', e.target.value)}
                        style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}
                        placeholder="Merchant Name"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        <Calendar size={14} />
                        <input
                            type="text"
                            value={data.date || ''}
                            onChange={(e) => handleFieldChange('date', e.target.value)}
                            style={{ ...inputStyle, width: '120px' }}
                            placeholder="YYYY-MM-DD"
                        />
                    </div>
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total</label>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>₹</span>
                        <input
                            type="number"
                            value={data.total || ''}
                            onChange={(e) => handleFieldChange('total', parseFloat(e.target.value))}
                            style={{ ...inputStyle, width: '120px', textAlign: 'right' }}
                            placeholder="0.00"
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                        <Tag size={12} />
                        <input
                            type="text"
                            value={data.category || ''}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                            style={{ ...inputStyle, width: '150px', textAlign: 'right' }}
                            placeholder="Category"
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase' }}>Items</h3>
                    <button onClick={addItem} className="glass-button" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}>
                        <Plus size={14} /> Add Item
                    </button>
                </div>
                <ul style={{ listStyle: 'none' }}>
                    {data.items && data.items.map((item, index) => (
                        <li key={index} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px dashed var(--card-border)', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                style={{ ...inputStyle, flex: 2 }}
                                placeholder="Item Name"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '4px' }}>
                                <span>₹</span>
                                <input
                                    type="number"
                                    value={item.price || ''}
                                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                    style={{ ...inputStyle, textAlign: 'right' }}
                                    placeholder="0.00"
                                />
                            </div>
                            <button
                                onClick={() => removeItem(index)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                                title="Remove Item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                    {(data.items || []).length === 0 && (
                        <li style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                            No items. Click "Add Item" to start manually.
                        </li>
                    )}
                </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8', alignItems: 'center' }}>
                <span>Tax</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>₹</span>
                    <input
                        type="number"
                        value={data.tax || ''}
                        onChange={(e) => handleFieldChange('tax', parseFloat(e.target.value))}
                        style={{ ...inputStyle, width: '80px', textAlign: 'right' }}
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={async () => {
                        try {
                            const btn = document.getElementById('wallet-btn');
                            if (btn) btn.innerText = 'Creating Pass...';

                            const res = await fetch('/api/create-wallet-pass', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            const result = await res.json();

                            if (result.saveUrl) {
                                window.open(result.saveUrl, '_blank');
                            } else {
                                const errorMsg = result.details || result.error || 'Unknown error';
                                alert(`Failed to generate pass: ${errorMsg}`);
                                console.error(result);
                            }
                        } catch (e) {
                            console.error(e);
                            alert('Error creating wallet pass');
                        } finally {
                            const btn = document.getElementById('wallet-btn');
                            if (btn) btn.innerText = 'Add to Google Wallet';
                        }
                    }}
                    id="wallet-btn"
                    className="glass-button"
                    style={{
                        background: '#000',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid #333'
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M21.25 4H2.75C1.784 4 1 4.784 1 5.75v12.5c0 .966.784 1.75 1.75 1.75h18.5c.966 0 1.75-.784 1.75-1.75V5.75C23 4.784 22.216 4 21.25 4zm-18.5 1.5h18.5c.138 0 .25.112.25.25V8H2.5V5.75c0-.138.112-.25.25-.25zM2.5 18.25V9.5h19v8.75c0 .138-.112.25-.25.25H2.75a.25.25 0 0 1-.25-.25z" /><path d="M5.5 12h3a.75.75 0 0 0 0-1.5h-3a.75.75 0 0 0 0 1.5zm0 3h5a.75.75 0 0 0 0-1.5h-5a.75.75 0 0 0 0 1.5z" />
                    </svg>
                    Add to Google Wallet
                </button>
            </div>
        </div>
    );
}
