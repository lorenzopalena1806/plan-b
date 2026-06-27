import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  let subscriptionEnd: Date | null = null;
  
  if (session.user.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId }
    });
    if (restaurant) {
      restaurantName = restaurant.name;
      restaurantSlug = restaurant.slug;
      subscriptionEnd = restaurant.subscriptionEnd;
    }
  }

  const systemConfig = await prisma.systemConfig.findFirst();
  const supportContact = systemConfig?.supportContact || '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Polosandia" style={{ height: '60px', marginRight: '12px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 'normal', fontSize: '1.25rem', borderLeft: '1px solid #ccc', paddingLeft: '12px', color: '#555' }}>{restaurantName}</span>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {subscriptionEnd && (
            <span style={{ 
              fontSize: '0.8rem', 
              backgroundColor: '#f3f4f6', 
              border: '1px solid var(--color-border)', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '4px',
              color: 'var(--color-text-light)',
              fontWeight: '500'
            }}>
              📅 Vence: {new Date(subscriptionEnd).toLocaleDateString('es-AR')}
            </span>
          )}
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
      <footer style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid var(--color-border)', 
        padding: '1rem', 
        textAlign: 'center', 
        fontSize: '0.85rem', 
        color: 'var(--color-text-light)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span>© Polosandia Sistema Administrativo</span>
        {supportContact && (
          <>
            <span>|</span>
            <a 
              href={supportContact} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--color-red-primary)', textDecoration: 'underline', fontWeight: '600' }}
            >
              📞 Soporte Técnico
            </a>
          </>
        )}
      </footer>
    </div>
  );
}
