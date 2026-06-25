import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'SUPERADMIN' && !session.user.restaurantId) {
    redirect('/developer');
  }

  let restaurantName = 'Mi Local';
  let restaurantSlug = '';
  
  if (session.user.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId }
    });
    if (restaurant) {
      restaurantName = restaurant.name;
      restaurantSlug = restaurant.slug;
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="text-red">Panel Admin</span> - {restaurantName}
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {restaurantSlug && (
            <Link 
              href={`/${restaurantSlug}`} 
              target="_blank" 
              className="btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Ver mi Tienda ↗
            </Link>
          )}
          <span className="text-muted" style={{ fontSize: '0.875rem', marginLeft: '1rem' }}>Usuario: {session.user.name}</span>
          {session.user.role === 'SUPERADMIN' && (
             <Link href="/developer" className="btn-outline" style={{ borderColor: 'var(--color-text)', color: 'var(--color-text)' }}>Volver a SuperAdmin</Link>
          )}
          <Link href="/api/auth/signout" className="btn-outline" style={{ borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }}>Cerrar Sesión</Link>
        </div>
      </nav>
      <main style={{ flex: 1, backgroundColor: 'var(--color-bg)' }}>
        {children}
      </main>
    </div>
  );
}
