import { prisma } from '@/lib/prisma';
import Catalog from '@/components/Catalog';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug }
  });

  if (!restaurant) {
    notFound();
  }

  const config = await prisma.config.findFirst({
    where: { restaurantId: restaurant.id }
  });
  
  const products = await prisma.product.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      modifiers: true,
      category: true,
    },
  });

  if (!config) {
    return <div className="container" style={{ paddingTop: '2rem' }}><h1>Error de configuración del local</h1></div>;
  }

  const now = new Date();
  const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  if (config.isSuspended) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8d7da', color: '#721c24' }}>
        <div className="card text-center" style={{ padding: '3rem 2rem', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Local Suspendido</h1>
          <p>Esta aplicación web ha sido suspendida temporalmente.</p>
        </div>
      </div>
    );
  }

  let isOpen = true;
  if (!config.isOpenOverride) {
    isOpen = false;
  } else {
    if (config.openTime < config.closeTime) {
      isOpen = currentTimeStr >= config.openTime && currentTimeStr <= config.closeTime;
    } else {
      isOpen = currentTimeStr >= config.openTime || currentTimeStr <= config.closeTime;
    }
  }

  return (
    <div>
      <header style={{ padding: '1.5rem 0', textAlign: 'center', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
        <h1 className="text-red" style={{ fontSize: '2rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>{restaurant.name}</h1>
        <p className="text-muted">Delivery & Takeaway</p>
      </header>

      {!isOpen && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', marginBottom: '2rem', fontWeight: 'bold' }}>
          Lo sentimos, en este momento el local se encuentra cerrado.
        </div>
      )}

      <Catalog products={products} whatsappNumber={config.whatsappNumber} isOpen={isOpen} slug={slug} />
    </div>
  );
}
