import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import RestaurantSwitcher from './components/RestaurantSwitcher';
import MobileMenu from './components/MobileMenu';

import Sidebar from './components/Sidebar';

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

  if (session.user.role === 'DRIVER') {
    redirect('/driver');
  }

  let restaurantName = 'Mi Local';
  let restaurantSlug = '';
  let subscriptionEnd: Date | null = null;
  let userManagedRestaurants: { id: number, name: string, slug: string }[] = [];
  
  if (session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { managedRestaurants: { select: { id: true, name: true, slug: true } } }
    });
    if (dbUser && dbUser.managedRestaurants) {
      userManagedRestaurants = dbUser.managedRestaurants;
    }
  }

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="admin-top-nav" style={{ backgroundColor: 'white', padding: '0.75rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Polosandia" className="admin-logo" style={{ height: '50px', marginRight: '12px', objectFit: 'contain' }} />
          </Link>
          <RestaurantSwitcher 
            restaurants={userManagedRestaurants.length > 0 ? userManagedRestaurants : [{ id: session.user.restaurantId as number, name: restaurantName, slug: restaurantSlug }]} 
            currentId={session.user.restaurantId} 
          />
        </div>
        <div className="hide-on-mobile" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-border)', margin: '0 0.5rem' }}></div>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>👤 {session.user.name}</span>
          {session.user.role === 'SUPERADMIN' && (
             <Link href="/developer" className="btn-outline" style={{ borderColor: 'var(--color-text)', color: 'var(--color-text)', padding: '0.25rem 0.75rem' }}>SuperAdmin</Link>
          )}
          <Link href="/api/auth/signout" className="btn-outline" style={{ borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)', padding: '0.25rem 0.75rem' }}>Salir</Link>
        </div>
        <MobileMenu 
          role={session.user.role} 
          subscriptionEnd={subscriptionEnd?.toISOString()} 
          userName={session.user.name} 
        />
      </nav>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar role={session.user.role} />
        <main className="admin-main-content" style={{ flex: 1, backgroundColor: 'var(--color-bg)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <footer className="hide-on-mobile" style={{ 
            backgroundColor: 'transparent', 
            borderTop: '1px solid var(--color-border)', 
            padding: '1.5rem 1rem', 
            textAlign: 'center', 
            fontSize: '0.85rem', 
            color: 'var(--color-text-light)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem'
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
        </main>
      </div>
    </div>
  );
}

