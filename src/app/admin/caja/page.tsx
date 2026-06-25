'use client';

import { useState, useEffect } from 'react';
import { Order, OrderItem } from '@prisma/client';
import Link from 'next/link';

type OrderWithItems = Order & { items: OrderItem[] };

export default function CajaPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
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

  const confirmOrder = async (id: number) => {
    if (!confirm('¿Has verificado el pago por WhatsApp y confirmas enviar este pedido a cocina?')) return;

    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'PENDING' } : o));
      
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING' })
      });
      
      if (!res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  };

  const rejectOrder = async (id: number) => {
    if (!confirm('¿Estás seguro de cancelar/rechazar este pedido?')) return;

    try {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'REJECTED' } : o));
      
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      });
      
      if (!res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando caja...</div>;

  const awaitingOrders = orders.filter(o => o.status === 'AWAITING_CONFIRMATION');

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h1 className="text-red">Caja / Cobranza</h1>
        <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
          <span className="text-muted text-bold animate-pulse">● Live (30s)</span>
          <button className="btn-outline" onClick={fetchOrders}>Refrescar</button>
          <Link href="/admin" className="btn-outline">Ir a Admin</Link>
          <Link href="/comandera" className="btn-outline">Ir a Comandera</Link>
        </div>
      </header>

      <h2 style={{ marginBottom: '1.5rem' }}>Pedidos Por Confirmar ({awaitingOrders.length})</h2>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Los pedidos que aparecen aquí ya fueron realizados por los clientes. Revisa tu WhatsApp para confirmar el pago y luego acéptalos para enviarlos a cocina.</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {awaitingOrders.map(order => (
          <div key={order.id} className="card" style={{ borderLeft: `4px solid ${order.deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-green)'}` }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <span className="text-bold text-muted">#{order.id} - {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <span className={`status-badge ${order.deliveryMethod === 'DELIVERY' ? 'bg-red-light text-red' : 'status-ready'}`}>
                {order.deliveryMethod}
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{order.customerName}</h3>
            {order.address && <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>📍 {order.address}</p>}
            
            {order.customerNotes && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                <strong>Aclaración:</strong> {order.customerNotes}
              </div>
            )}
            
            <div style={{ marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)' }}>
              {order.items.map(item => {
                const modifiers = item.notes ? JSON.parse(item.notes) : [];
                return (
                  <div key={item.id} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <div className="text-bold">{item.quantity}x {item.productName}</div>
                    {modifiers.length > 0 && (
                      <div className="text-muted" style={{ paddingLeft: '1rem' }}>
                        {modifiers.map((mod: any) => mod.name).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed var(--color-border)', textAlign: 'right', fontSize: '1.25rem' }} className="text-bold text-red">
                TOTAL: ${order.total.toLocaleString()}
              </div>
            </div>
            
            <div className="flex" style={{ gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 2 }} onClick={() => confirmOrder(order.id)}>✅ Confirmar Pago</button>
              <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => rejectOrder(order.id)}>❌ Rechazar</button>
            </div>
          </div>
        ))}

        {awaitingOrders.length === 0 && (
          <div className="text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            No hay pedidos pendientes de confirmación.
          </div>
        )}
      </div>
    </div>
  );
}
