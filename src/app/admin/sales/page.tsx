'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  notes: string | null;
}

interface Order {
  id: number;
  customerName: string;
  deliveryMethod: string;
  address: string | null;
  total: number;
  createdAt: string;
  customerNotes: string | null;
  paymentMethod?: string | null;
  paymentDetails?: string | null;
  items: OrderItem[];
}

interface ProductSale {
  name: string;
  quantity: number;
  revenue: number;
}

interface SalesData {
  orders: Order[];
  stats: {
    totalEarnings: number;
    todayEarnings: number;
    totalOrdersCount: number;
    todayOrdersCount: number;
  };
  productSales: ProductSale[];
}

export default function SalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'TODAY'>('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/admin/sales');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        if (res.status === 403) {
          setError('Acceso Denegado: Esta sección es exclusiva para el dueño del local.');
        } else {
          setError('Error al cargar las estadísticas de ventas.');
        }
      }
    } catch (error) {
      console.error(error);
      setError('Error de conexión al cargar datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el pedido #${id}? Esta acción no se puede deshacer y los montos se descontarán del total.`)) return;

    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchSales();
      } else {
        alert('Error al eliminar el pedido.');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error de conexión.');
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '3rem 0' }}>Cargando estadísticas de ventas...</div>;

  if (error) {
    return (
      <div className="container flex justify-center items-center" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
        <div className="card text-center flex flex-col items-center" style={{ padding: '3rem 2rem', maxWidth: '500px', borderTop: '5px solid var(--color-red-primary)' }}>
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</span>
          <h2 className="text-bold text-red" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Acceso Restringido</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{error}</p>
          <Link href="/admin" className="btn-primary" style={{ width: 'max-content', padding: '0.75rem 2rem' }}>
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return <div className="container" style={{ padding: '2rem 0' }}>Error al cargar los datos.</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter orders based on selected tab and search query
  const filteredOrders = data.orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const matchesFilter = filter === 'ALL' || orderDate >= today;
    const matchesSearch = order.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          order.id.toString() === search ||
                          (order.address && order.address.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Calculate filtered stats
  const filteredTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const filteredAOV = filteredOrders.length > 0 ? (filteredTotal / filteredOrders.length) : 0;
  const maxQuantity = Math.max(...data.productSales.map(ps => ps.quantity), 1);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>Historial de Ventas</h1>
          <p className="text-muted">Análisis financiero y métricas de pedidos entregados</p>
        </div>
        <Link href="/admin" className="btn-outline">Volver al Panel</Link>
      </header>

      {/* Modern Stats Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Card 1: Filter Earnings */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--color-red-primary) 0%, var(--color-red-dark, #cc303d) 100%)', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: 'var(--border-radius-lg)', 
          boxShadow: 'var(--shadow-md)', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          minHeight: '130px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '0.875rem', opacity: 0.9, fontWeight: '600' }}>Ganancias ({filter === 'TODAY' ? 'Hoy' : 'Histórico'})</span>
          <h3 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0.5rem 0', color: 'white' }}>${filteredTotal.toLocaleString()}</h3>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pedidos: {filteredOrders.length}</span>
        </div>

        {/* Card 2: Absolute Sales */}
        <div className="card" style={{ 
          backgroundColor: 'var(--color-card)', 
          padding: '1.5rem', 
          borderRadius: 'var(--border-radius-lg)', 
          boxShadow: 'var(--shadow-sm)', 
          border: '1px solid var(--color-border)',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          minHeight: '130px' 
        }}>
          <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600' }}>Ventas del Local</span>
          <h3 className="text-bold" style={{ fontSize: '2.25rem', margin: '0.5rem 0', color: 'var(--color-text)' }}>
            ${(filter === 'TODAY' ? data.stats.todayEarnings : data.stats.totalEarnings).toLocaleString()}
          </h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {filter === 'TODAY' ? `${data.stats.todayOrdersCount} pedidos hoy` : `${data.stats.totalOrdersCount} pedidos en total`}
          </span>
        </div>

        {/* Card 3: Ticket Promedio */}
        <div className="card" style={{ 
          backgroundColor: 'var(--color-card)', 
          padding: '1.5rem', 
          borderRadius: 'var(--border-radius-lg)', 
          boxShadow: 'var(--shadow-sm)', 
          border: '1px solid var(--color-border)',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          minHeight: '130px' 
        }}>
          <span className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '600' }}>Ticket Promedio (AOV)</span>
          <h3 className="text-bold text-green" style={{ fontSize: '2.25rem', margin: '0.5rem 0' }}>
            ${filteredAOV.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Valor promedio por compra realizada</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Orders List */}
        <div>
          <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="flex" style={{ gap: '0.5rem' }}>
                <button 
                  className={`btn-outline ${filter === 'ALL' ? 'bg-red-light text-red text-bold' : ''}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderColor: filter === 'ALL' ? 'var(--color-red-primary)' : 'var(--color-border)' }}
                  onClick={() => setFilter('ALL')}
                >
                  Histórico
                </button>
                <button 
                  className={`btn-outline ${filter === 'TODAY' ? 'bg-red-light text-red text-bold' : ''}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderColor: filter === 'TODAY' ? 'var(--color-red-primary)' : 'var(--color-border)' }}
                  onClick={() => setFilter('TODAY')}
                >
                  Solo Hoy
                </button>
              </div>

              <input 
                type="text" 
                placeholder="Buscar cliente, dirección o N°..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', minWidth: '250px' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', backgroundColor: '#fafafa' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>ID</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Fecha</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Cliente</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Productos</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Notas</th>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-light)', fontWeight: 'bold' }}>#{order.id}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}<br/>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div className="text-bold">{order.customerName}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem' }} className={order.deliveryMethod === 'DELIVERY' ? 'text-red' : 'text-green'}>
                            {order.deliveryMethod === 'DELIVERY' ? `🏍️ ${order.address || 'Delivery'}` : '🛍️ Retiro'}
                          </span>
                          {order.paymentMethod && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                              {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '📱 Transferencia'} 
                              {order.paymentDetails && ` (${order.paymentDetails})`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{ marginBottom: '0.25rem' }}>
                            <span className="text-bold" style={{ color: 'var(--color-text)' }}>{item.quantity}x</span> {item.productName}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', maxWidth: '150px', wordBreak: 'break-word' }}>
                        {order.customerNotes ? (
                          <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-block' }}>
                            {order.customerNotes}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1rem' }} className="text-red">
                        ${order.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-light)',
                            fontSize: '1.25rem',
                            transition: 'transform 0.2s'
                          }}
                          title="Eliminar pedido"
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
                        No se encontraron pedidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product Rankings with Progress Bars */}
        <div className="card" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-lg)', alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', fontWeight: '700' }}>
            Productos Más Vendidos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.productSales.map((ps, idx) => {
              const percentage = (ps.quantity / maxQuantity) * 100;
              return (
                <div key={idx} style={{ fontSize: '0.875rem' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                    <span className="text-bold" style={{ color: 'var(--color-text)' }}>{ps.name}</span>
                    <span className="text-bold text-red">${ps.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    <span>{ps.quantity} uds.</span>
                    <span>{percentage.toFixed(0)}% del max.</span>
                  </div>
                  {/* Progress bar wrapper */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', marginTop: '0.35rem', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--color-red-primary)', 
                      borderRadius: '3px', 
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }} />
                  </div>
                </div>
              );
            })}
            {data.productSales.length === 0 && (
              <p className="text-muted text-center" style={{ fontSize: '0.875rem' }}>
                No hay productos vendidos registrados.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
