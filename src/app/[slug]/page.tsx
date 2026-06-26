import { prisma } from '@/lib/prisma';
import Catalog from '@/components/Catalog';
import ShareButton from '@/components/ShareButton';
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
    where: { 
      restaurantId: restaurant.id,
      isActive: true
    },
    include: {
      modifiers: true,
      category: true,
    },
  });

  if (!config) {
    return <div className="container" style={{ paddingTop: '2rem' }}><h1>Error de configuración del local</h1></div>;
  }

  const now = new Date();
  const currentTimeStr = now.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });
  
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

  const themeColor = config.themeColor || '#e11d48';
  const bgColor = config.bgColor || '#ffffff';
  const cardColor = config.cardColor || '#ffffff';
  const textColor = config.textColor || '#1a1a1a';
  const fontFamily = config.fontFamily || 'Inter';

  // Simple brightness calculation or keyword matching for dark themes
  const isDarkBg = bgColor === '#121212' || bgColor === '#1a1a1a' || bgColor === '#000000' || 
                   (bgColor.startsWith('#') && parseInt(bgColor.substring(1, 3), 16) < 120);

  const borderVal = isDarkBg ? '#2d2d2d' : '#eeeeee';
  const textLightVal = isDarkBg ? '#9ca3af' : '#666666';
  const redLightVal = isDarkBg ? '#3b1216' : '#ffebec';
  const greenLightVal = isDarkBg ? '#062923' : '#e6f7f5';

  const cssVariables = {
    '--color-bg': bgColor,
    '--color-card': cardColor,
    '--color-text': textColor,
    '--color-text-light': textLightVal,
    '--color-border': borderVal,
    '--color-red-primary': themeColor,
    '--color-red-light': redLightVal,
    '--color-green-light': greenLightVal,
    '--font-sans': fontFamily === 'Inter' ? `'Inter', system-ui, -apple-system, sans-serif` : `'${fontFamily}', sans-serif`,
  } as React.CSSProperties;

  let fontLink = '';
  if (fontFamily === 'Poppins') {
    fontLink = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
  } else if (fontFamily === 'Montserrat') {
    fontLink = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap';
  } else if (fontFamily === 'Playfair Display') {
    fontLink = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';
  }

  return (
    <div style={{ ...cssVariables, backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {fontLink && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={fontLink} rel="stylesheet" />
        </>
      )}

      <header style={{ padding: '1.5rem 0', textAlign: 'center', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
        {config.logoUrl ? (
          <img src={config.logoUrl} alt={restaurant.name} style={{ maxHeight: '120px', objectFit: 'contain', margin: '0 auto', marginBottom: '0.5rem', display: 'block' }} />
        ) : (
          <h1 className="text-red" style={{ fontSize: '2rem', letterSpacing: '-1px', textTransform: 'uppercase' }}>{restaurant.name}</h1>
        )}
        <p className="text-muted">Delivery & Takeaway</p>

        {/* Social Buttons */}
        <div className="social-buttons-container">
          {config.instagramUrl && (
            <a 
              href={config.instagramUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-btn instagram"
              title="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          )}
          
          {(config.whatsappUrl || config.whatsappNumber) && (
            <a 
              href={config.whatsappUrl || `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-btn whatsapp"
              title="WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </a>
          )}

          {config.mapsUrl && (
            <a 
              href={config.mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-btn maps"
              title="Cómo llegar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </a>
          )}
          
          <ShareButton />
        </div>
      </header>

      {!isOpen && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', marginBottom: '2rem', fontWeight: 'bold' }}>
          Lo sentimos, en este momento el local se encuentra cerrado.
        </div>
      )}

      <div className="container" style={{ paddingBottom: '3rem' }}>
        <Catalog 
          products={products} 
          whatsappNumber={config.whatsappNumber} 
          isOpen={isOpen} 
          slug={slug} 
          cardLayout={config.cardLayout || 'grid'} 
          bankAlias={config.bankAlias || ''} 
          shippingFee={config.shippingFee || 0}
        />
      </div>
    </div>
  );
}
