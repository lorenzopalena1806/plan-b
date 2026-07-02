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
  dailyNumber?: number | null;
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
  const [completedTrips, setCompletedTrips] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/driver/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setOrders(data.orders || []);
          setCompletedTrips(data.completedTrips || 0);
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

  const openHistory = async () => {
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/driver/history');
      if (res.ok) {
        setHistoryOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando tus viajes...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 className="text-red" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mis Viajes Activos</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Aquí verás los pedidos que tenés que entregar</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.5rem 1rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #bae6fd' }}>
            🛵 Viajes entregados hoy: {completedTrips}
          </div>
          <button 
            onClick={openHistory}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#fff', color: '#333', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Ver Historial
          </button>
        </div>
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
                <span className="text-bold" style={{ fontSize: '1.25rem' }}>Pedido #{order.dailyNumber || order.id}</span>
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

      {isHistoryOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card flex-col" style={{ width: '100%', maxWidth: '600px', height: '80vh', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, display: 'flex', background: 'var(--color-bg)', padding: '1.5rem', overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 className="text-bold">Mi Historial de Viajes</h2>
              <button onClick={() => setIsHistoryOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cargando historial...</div>
              ) : historyOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No tenés viajes completados recientes.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {historyOrders.map((order: any) => (
                    <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', backgroundColor: '#fff' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                        <span className="text-bold">#{order.dailyNumber || order.id} - {order.customerName}</span>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>
                          {new Date(order.createdAt).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>📍 {order.address}</div>
                      <div className="text-bold" style={{ color: 'var(--color-green)', textAlign: 'right' }}>
                        Total: ${order.total.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', color: '#666', fontSize: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              Mostrando tus últimos 50 viajes entregados
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
