import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.restaurantId) {
    if (session?.user?.role === 'SUPERADMIN') {
      redirect('/developer');
    }
    if (session?.user?.role === 'DRIVER') {
      redirect('/driver');
    }
    redirect('/login');
  }

  if (session.user.role === 'DRIVER') {
    redirect('/driver');
  }

  const isStaff = session.user.role === 'STAFF';

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId }
  });
  const businessType = restaurant?.businessType || 'RESTAURANT';

  const allOrders = !isStaff ? await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      restaurantId: session.user.restaurantId
    }
  }) : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOrders = allOrders.filter(order => new Date(order.createdAt) >= today);

  const historicalSales = allOrders.reduce((sum, order) => sum + order.total, 0);
  const todaysSales = todaysOrders.reduce((sum, order) => sum + order.total, 0);

  const todaysSalesCash = todaysOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
  const todaysSalesTransfer = todaysOrders.filter(o => o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'Transferencia').reduce((sum, o) => sum + o.total, 0);

  const historicalSalesCash = allOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
  const historicalSalesTransfer = allOrders.filter(o => o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'Transferencia').reduce((sum, o) => sum + o.total, 0);

  const drivers = !isStaff ? await prisma.driver.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      isActive: true
    },
    include: {
      orders: {
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: today
          }
        }
      }
    }
  }) : [];

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>{isStaff ? 'Panel de Trabajo' : 'Panel de Administrador'}</h1>
          <p className="text-muted">{isStaff ? 'Accesos rápidos para la operación diaria' : 'Métricas generales y administración'}</p>
        </div>
        <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          {!isStaff && (
            <>
              <Link href="/admin/products" className="btn-outline">Productos / Catálogo</Link>
              <Link href="/admin/categories" className="btn-outline">Categorías</Link>
              <Link href="/admin/modifiers" className="btn-outline">Modificadores</Link>
              <Link href="/admin/users" className="btn-outline">Usuarios / Personal</Link>
              <Link href="/admin/drivers" className="btn-outline">Repartidores</Link>
              <Link href="/admin/banners" className="btn-outline">Banners</Link>
              <Link href="/admin/sales" className="btn-outline">Historial de Ventas</Link>
              <Link href="/admin/coupons" className="btn-outline">Cupones</Link>
              <Link href="/admin/billing" className="btn-outline">Facturación</Link>
              <Link href="/admin/caja/pos" className="btn-outline">Punto de Venta</Link>
            </>
          )}
        </div>
      </header>

      {isStaff ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
          {businessType === 'RESTAURANT' && (
            <Link href="/admin/comandera" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid var(--color-red-primary)', minHeight: '220px' }}>
                <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🍳</span>
                <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Comandera</h2>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>Visualiza los pedidos confirmados y controla la cocina en tiempo real.</p>
              </div>
            </Link>
          )}

          <Link href="/admin/caja" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid var(--color-green)', minHeight: '220px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>{businessType === 'RESTAURANT' ? '💵' : '🛒'}</span>
              <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {businessType === 'RESTAURANT' ? 'Caja / Cobranza' : 'Caja / Pedidos'}
              </h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                {businessType === 'RESTAURANT' 
                  ? 'Confirma pagos recibidos por WhatsApp y aprueba comandas entrantes.'
                  : 'Gestiona los pedidos entrantes y confirma pagos recibidos.'}
              </p>
            </div>
          </Link>

          <Link href="/admin/products" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid #6b7280', minHeight: '220px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>{businessType === 'RESTAURANT' ? '🍔' : '📦'}</span>
              <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Control de Catálogo</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                {businessType === 'RESTAURANT'
                  ? 'Pausa platos o combos agotados para que no aparezcan en la carta pública.'
                  : 'Pausa productos sin stock para que no aparezcan en la tienda pública.'}
              </p>
            </div>
          </Link>

          <Link href="/admin/caja/pos" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid #2563eb', minHeight: '220px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</span>
              <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Punto de Venta</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Carga pedidos presenciales o telefónicos manualmente.</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <Link href="/admin/sales" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card" style={{ padding: '2rem 1rem', cursor: 'pointer' }}>
              <h2 className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Ventas de Hoy</h2>
              <p className="text-bold text-red" style={{ fontSize: '2.5rem' }}>${todaysSales.toLocaleString()}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '4px', color: '#166534' }}>
                  <strong>💵 Efectivo:</strong> ${todaysSalesCash.toLocaleString()}
                </div>
                <div style={{ background: '#eff6ff', padding: '0.5rem 1rem', borderRadius: '4px', color: '#1e40af' }}>
                  <strong>📱 Transferencia:</strong> ${todaysSalesTransfer.toLocaleString()}
                </div>
              </div>
              <p className="text-muted" style={{ marginTop: '1rem' }}>{todaysOrders.length} pedidos completados</p>
            </div>
          </Link>

          <Link href="/admin/sales" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card" style={{ padding: '2rem 1rem', cursor: 'pointer' }}>
              <h2 className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Ventas Históricas</h2>
              <p className="text-bold" style={{ fontSize: '2.5rem' }}>${historicalSales.toLocaleString()}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '4px', color: '#166534' }}>
                  <strong>💵 Efectivo:</strong> ${historicalSalesCash.toLocaleString()}
                </div>
                <div style={{ background: '#eff6ff', padding: '0.5rem 1rem', borderRadius: '4px', color: '#1e40af' }}>
                  <strong>📱 Transferencia:</strong> ${historicalSalesTransfer.toLocaleString()}
                </div>
              </div>
              <p className="text-muted" style={{ marginTop: '1rem' }}>{allOrders.length} pedidos en total</p>
            </div>
          </Link>
        </div>
      )}

      {!isStaff && drivers.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            Desempeño de Repartidores (Hoy)
          </h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {drivers.map(driver => (
              <div key={driver.id} className="card flex items-center justify-between" style={{ padding: '1rem' }}>
                <div>
                  <div className="text-bold">{driver.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{driver.phone}</div>
                </div>
                <div style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.5rem 0.75rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  🛵 {driver.orders.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
