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
              <Link href="/admin/categories" className="btn-outline">Categorías</Link>
              <Link href="/admin/modifiers" className="btn-outline">Modificadores</Link>
              <Link href="/admin/users" className="btn-outline">Usuarios / Personal</Link>
              <Link href="/admin/drivers" className="btn-outline">Repartidores</Link>
              <Link href="/admin/banners" className="btn-outline">Banners</Link>
              <Link href="/admin/sales" className="btn-outline">Historial de Ventas</Link>
              <Link href="/admin/coupons" className="btn-outline">Cupones</Link>
              <Link href="/admin/billing" className="btn-outline">Facturación</Link>
            </>
          )}
        </div>
      </header>

      {isStaff ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
          <Link href="/admin/comandera" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid var(--color-red-primary)', minHeight: '220px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🍳</span>
              <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Comandera</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Visualiza los pedidos confirmados y controla la cocina en tiempo real.</p>
            </div>
          </Link>

          <Link href="/admin/caja" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid var(--color-green)', minHeight: '220px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>💵</span>
              <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Caja / Cobranza</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Confirma pagos recibidos por WhatsApp y aprueba comandas entrantes.</p>
            </div>
          </Link>

          <Link href="/admin/products" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card flex flex-col justify-center" style={{ padding: '3rem 1.5rem', cursor: 'pointer', borderTop: '5px solid #6b7280', minHeight: '220px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍔</span>
              <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Control de Catálogo</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Pausa platos o combos agotados para que no aparezcan en la carta pública.</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <Link href="/admin/sales" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card" style={{ padding: '3rem 1rem', cursor: 'pointer' }}>
              <h2 className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Ventas de Hoy (Detalle)</h2>
              <p className="text-bold text-red" style={{ fontSize: '3rem' }}>${todaysSales.toLocaleString()}</p>
              <p className="text-muted" style={{ marginTop: '0.5rem' }}>{todaysOrders.length} pedidos completados</p>
            </div>
          </Link>

          <Link href="/admin/sales" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card text-center hover-card" style={{ padding: '3rem 1rem', cursor: 'pointer' }}>
              <h2 className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Ventas Históricas (Detalle)</h2>
              <p className="text-bold" style={{ fontSize: '3rem' }}>${historicalSales.toLocaleString()}</p>
              <p className="text-muted" style={{ marginTop: '0.5rem' }}>{allOrders.length} pedidos en total</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
