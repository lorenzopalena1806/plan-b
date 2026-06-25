import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.restaurantId) {
    if (session?.user?.role === 'SUPERADMIN') {
      redirect('/developer');
    }
    redirect('/login');
  }

  const allOrders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      restaurantId: session.user.restaurantId
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOrders = allOrders.filter(order => new Date(order.createdAt) >= today);

  const historicalSales = allOrders.reduce((sum, order) => sum + order.total, 0);
  const todaysSales = todaysOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <h1>Panel de Administrador</h1>
        <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/products" className="btn-outline">Catálogo</Link>
          <Link href="/admin/categories" className="btn-outline">Categorías</Link>
          <Link href="/admin/modifiers" className="btn-outline">Modificadores</Link>
          <Link href="/admin/sales" className="btn-outline">Historial de Ventas</Link>
          <Link href="/admin/settings" className="btn-outline">Configuración</Link>
          <Link href="/admin/caja" className="btn-outline" style={{ borderColor: 'var(--color-green)', color: 'var(--color-green)' }}>Caja</Link>
          <Link href="/admin/comandera" className="btn-outline" style={{ borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }}>Comandera</Link>
        </div>
      </header>

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
    </div>
  );
}
