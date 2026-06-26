'use client';

import { useState, useEffect, useRef } from 'react';
import { Order, OrderItem } from '@prisma/client';

type OrderWithItems = Order & { items: OrderItem[] };

function playNewOrderSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.35); // C5
    playNote(659.25, now + 0.12, 0.45); // E5
    playNote(783.99, now + 0.24, 0.55); // G5
  } catch (e) {
    console.error('Web Audio API error:', e);
  }
}

export default function ComanderaPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const knownOrderIdsRef = useRef<Set<number>>(new Set());

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const ids = orders.map(o => o.id);
      if (knownOrderIdsRef.current.size > 0) {
        const hasNewOrder = orders.some(o => o.status === 'PENDING' && !knownOrderIdsRef.current.has(o.id));
        if (hasNewOrder) {
          playNewOrderSound();
        }
      }
      knownOrderIdsRef.current = new Set(ids);
    }
  }, [orders]);

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) {
        // Revert on failure
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  };

  const columns = [
    { id: 'PENDING', title: 'Pendiente' },
    { id: 'PREPARING', title: 'En Preparación' },
    { id: 'READY', title: 'Listo para entregar' }
  ];

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando comandera...</div>;

  return (
    <div style={{ padding: '1rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-red">Comandera</h1>
        <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
          <span className="text-muted text-bold animate-pulse">● Live (30s)</span>
          <button className="btn-outline" onClick={fetchOrders}>Refrescar</button>
        </div>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        {columns.map(col => (
          <div key={col.id} style={{ background: '#f8f9fa', borderRadius: 'var(--border-radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>{col.title} ({orders.filter(o => o.status === col.id).length})</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {orders.filter(o => o.status === col.id).map(order => (
                <div key={order.id} className="card" style={{ borderLeft: `4px solid ${order.deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-green)'}` }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <span className="text-bold text-muted">#{order.id}</span>
                    <span className={`status-badge ${order.deliveryMethod === 'DELIVERY' ? 'bg-red-light text-red' : 'status-ready'}`}>
                      {order.deliveryMethod}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{order.customerName}</h3>
                  
                  {order.paymentMethod && (
                    <div style={{ 
                      marginBottom: '0.5rem', 
                      padding: '0.5rem', 
                      background: order.paymentMethod === 'TRANSFER' ? 'var(--color-green-light)' : 'rgba(0,0,0,0.03)', 
                      border: `1px solid ${order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-border)'}`,
                      color: order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-text)', 
                      borderRadius: 'var(--border-radius-sm)', 
                      fontSize: '0.875rem' 
                    }}>
                      <strong>Pago:</strong> {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '📱 Transferencia'}
                      {order.paymentDetails && <div style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>{order.paymentDetails}</div>}
                    </div>
                  )}

                  {order.customerNotes && (
                    <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                      <strong>Nota:</strong> {order.customerNotes}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    {order.items.map(item => {
                      const modifiers = item.notes ? JSON.parse(item.notes) : [];
                      return (
                        <div key={item.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--color-border)' }}>
                          <div className="text-bold">{item.quantity}x {item.productName}</div>
                          {modifiers.length > 0 && (
                            <ul style={{ listStyleType: 'none', paddingLeft: '1rem', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                              {modifiers.map((mod: any, idx: number) => (
                                <li key={idx} className={mod.type === 'FREE' ? 'text-red' : 'text-green text-bold'}>
                                  {mod.type === 'FREE' ? 'SIN ' : 'EXTRA '}{mod.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between mt-auto">
                    {col.id === 'PENDING' && <button className="btn-primary" style={{ background: '#004085' }} onClick={() => updateOrderStatus(order.id, 'PREPARING')}>A Preparación</button>}
                    {col.id === 'PREPARING' && <button className="btn-primary" style={{ background: '#155724' }} onClick={() => updateOrderStatus(order.id, 'READY')}>Marcar Listo</button>}
                    {col.id === 'READY' && <button className="btn-outline" onClick={() => updateOrderStatus(order.id, 'COMPLETED')}>Archivar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
