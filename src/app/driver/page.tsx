'use client';

import { useState, useEffect } from 'react';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  notes: string | null;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone: string | null;
  address: string | null;
  total: number;
  paymentMethod: string | null;
  paymentDetails: string | null;
  customerNotes: string | null;
  items: OrderItem[];
}

export default function DriverPortal() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/driver/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setOrders(data);
        }
      } else {
        setError('Error al cargar pedidos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsDelivered = async (orderId: number) => {
    if (!confirm('¿Estás seguro de marcar este pedido como ENTREGADO?')) return;
    
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      if (res.ok) {
        fetchOrders();
      } else {
        alert('Error al marcar como entregado.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando tus viajes...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 className="text-red" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mis Viajes Activos</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Aquí verás los pedidos que tenés que entregar</p>
      </header>

      {orders.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: '3rem 1rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛵</span>
          No tenés viajes activos en este momento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ borderLeft: '4px solid var(--color-red-primary)', padding: '1rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                <span className="text-bold" style={{ fontSize: '1.25rem' }}>Pedido #{order.id}</span>
                <span className="status-badge bg-red-light text-red">En Camino</span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>📍 {order.address}</div>
                <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  👤 {order.customerName} {order.customerPhone && `- 📱 ${order.customerPhone}`}
                </div>
              </div>

              {order.customerNotes && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.875rem' }}>
                  <strong>Nota del cliente:</strong> {order.customerNotes}
                </div>
              )}

              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }}>
                <div className="text-bold" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Detalle de Comida:</div>
                {order.items.map(item => {
                  let rawNote = '';
                  let modifiers = [];
                  if (item.notes) {
                    try {
                      const parsed = JSON.parse(item.notes);
                      if (Array.isArray(parsed)) modifiers = parsed;
                      else rawNote = item.notes;
                    } catch (e) {
                      rawNote = item.notes;
                    }
                  }
                  return (
                    <div key={item.id} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span className="text-bold">{item.quantity}x</span> {item.productName}
                      {modifiers.length > 0 && <span className="text-muted"> ({modifiers.map((m: any) => m.name).join(', ')})</span>}
                      {rawNote && <span className="text-muted"> ({rawNote})</span>}
                    </div>
                  );
                })}
              </div>

              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                background: order.paymentMethod === 'TRANSFER' ? 'var(--color-green-light)' : 'var(--color-red-light)', 
                border: `1px solid ${order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-red-primary)'}`,
                color: order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-red-primary)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                  {order.paymentMethod === 'TRANSFER' ? '✅ PAGADO (Transferencia)' : '💰 A COBRAR EN EFECTIVO'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', marginTop: '0.25rem' }}>
                  ${order.total.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {order.customerPhone && (
                  <a 
                    href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-outline" 
                    style={{ flex: 1, textAlign: 'center', borderColor: '#25D366', color: '#25D366', textDecoration: 'none' }}
                  >
                    💬 Contactar
                  </a>
                )}
                <button 
                  className="btn-primary" 
                  style={{ flex: 2, background: 'var(--color-green)' }}
                  onClick={() => markAsDelivered(order.id)}
                >
                  📍 Entregado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
