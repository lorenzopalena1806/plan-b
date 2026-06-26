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

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/admin/sales');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando estadísticas de ventas...</div>;
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

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>Historial de Ventas</h1>
          <p className="text-muted">Análisis detallado de pedidos entregados y archivados</p>
        </div>
        <Link href="/admin" className="btn-outline">Volver al Panel</Link>
      </header>

      {/* Stats row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Ganancias de Hoy</span>
          <h3 className="text-bold text-red" style={{ fontSize: '2rem', margin: '0.5rem 0' }}>${data.stats.todayEarnings.toLocaleString()}</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{data.stats.todayOrdersCount} pedidos hoy</span>
        </div>
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Ganancias Históricas</span>
          <h3 className="text-bold" style={{ fontSize: '2rem', margin: '0.5rem 0' }}>${data.stats.totalEarnings.toLocaleString()}</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{data.stats.totalOrdersCount} pedidos en total</span>
        </div>
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>Filtro Actual ({filter === 'TODAY' ? 'Hoy' : 'Histórico'})</span>
          <h3 className="text-bold text-red" style={{ fontSize: '2rem', margin: '0.5rem 0' }}>${filteredTotal.toLocaleString()}</h3>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{filteredOrders.length} pedidos mostrados</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Orders List */}
        <div>
          <div className="card" style={{ padding: '1.5rem' }}>
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
                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', minWidth: '250px' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Fecha</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Cliente</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Productos</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Notas</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-muted)', fontWeight: 'bold' }}>#{order.id}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {new Date(order.createdAt).toLocaleDateString()}<br/>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
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
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {order.items.map(item => (
                          <div key={item.id}>
                            {item.quantity}x {item.productName}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', maxWidth: '150px', wordBreak: 'break-word' }}>
                        {order.customerNotes ? (
                          <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '2px 4px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {order.customerNotes}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                        ${order.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                        No se encontraron pedidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product Rankings */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Productos Más Vendidos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.productSales.map((ps, idx) => (
              <div key={idx} className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
                <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                  <div className="text-bold">{ps.name}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {ps.quantity} unidades
                  </span>
                </div>
                <div className="text-bold text-red" style={{ textAlign: 'right' }}>
                  ${ps.revenue.toLocaleString()}
                </div>
              </div>
            ))}
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
