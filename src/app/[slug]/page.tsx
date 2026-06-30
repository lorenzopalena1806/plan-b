import { prisma } from '@/lib/prisma';
import Catalog from '@/components/Catalog';
import ShareButton from '@/components/ShareButton';
import { notFound } from 'next/navigation';
import { ThemeProvider, ClientThemeWrapper } from '@/components/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

function checkIsOpen(businessHours: any[], todayDay: number, currentTimeStr: string) {
  const todayHours = businessHours.find(h => h.dayOfWeek === todayDay);
  const yesterdayDay = (todayDay - 1 + 7) % 7;
  const yesterdayHours = businessHours.find(h => h.dayOfWeek === yesterdayDay);

  const isTimeInShift = (open: string | null, close: string | null, checkOvernightOnly: boolean = false) => {
    if (!open || !close) return false;
    const crossesMidnight = open > close;
    if (crossesMidnight) {
      if (checkOvernightOnly) {
        return currentTimeStr <= close;
      } else {
        return currentTimeStr >= open || currentTimeStr <= close;
      }
    } else {
      if (checkOvernightOnly) {
        return false;
      }
      return currentTimeStr >= open && currentTimeStr <= close;
    }
  };

  // 1. Check yesterday's shifts that cross midnight
  if (yesterdayHours && yesterdayHours.isOpen) {
    if (isTimeInShift(yesterdayHours.shift1Open, yesterdayHours.shift1Close, true) ||
        isTimeInShift(yesterdayHours.shift2Open, yesterdayHours.shift2Close, true)) {
      return true;
    }
  }

  // 2. Check today's shifts
  if (todayHours && todayHours.isOpen) {
    if (isTimeInShift(todayHours.shift1Open, todayHours.shift1Close, false) ||
        isTimeInShift(todayHours.shift2Open, todayHours.shift2Close, false)) {
      return true;
    }
  }

  return false;
}

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
      category: {
        include: {
          discounts: { orderBy: { quantity: 'desc' } }
        }
      },
      modifiers: true
    },
    orderBy: [
      { categoryId: 'asc' },
      { name: 'asc' }
    ]
  });

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
    include: { discounts: { orderBy: { quantity: 'desc' } } }
  });

  const banners = await prisma.banner.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    orderBy: { orderIndex: 'asc' }
  });

  if (!config) {
    return <div className="container" style={{ paddingTop: '2rem' }}><h1>Error de configuración del local</h1></div>;
  }

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

  // Fetch business hours from the database
  let businessHours = await prisma.businessHour.findMany({
    where: { restaurantId: restaurant.id }
  });

  // Auto-generate defaults if they don't exist
  if (businessHours.length < 7) {
    const days = [0, 1, 2, 3, 4, 5, 6];
    const existingDays = new Set(businessHours.map(h => h.dayOfWeek));
    const defaults = [];
    for (const d of days) {
      if (!existingDays.has(d)) {
        defaults.push({
          dayOfWeek: d,
          isOpen: true,
          shift1Open: '12:00',
          shift1Close: '15:00',
          shift2Open: '20:00',
          shift2Close: '23:59',
          restaurantId: restaurant.id
        });
      }
    }
    if (defaults.length > 0) {
      await prisma.businessHour.createMany({
        data: defaults
      });
      businessHours = await prisma.businessHour.findMany({
        where: { restaurantId: restaurant.id }
      });
    }
  }

  // Get current Argentina time
  const argentinaTimeStr = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const argentinaDate = new Date(argentinaTimeStr);
  const todayDay = argentinaDate.getDay(); // 0 = Sunday, 1 = Monday...
  const currentHour = argentinaDate.getHours();
  const currentMinute = argentinaDate.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  let isOpen = true;
  if (config.isOpenOverride) {
    isOpen = true;
  } else {
    // Check weekly double shift hours
    isOpen = checkIsOpen(businessHours, todayDay, currentTimeStr);
  }

  const themeColor = config.themeColor || '#e11d48';
  const buttonColor = config.buttonColor || '#ffffff';
  const bgColor = config.bgColor || '#ffffff';
  const cardColor = config.cardColor || '#ffffff';
  const textColor = config.textColor || '#1a1a1a';
  const fontFamily = config.fontFamily || 'Inter';

  // Simple brightness calculation or keyword matching for dark themes
  const isDarkBg = bgColor === '#121212' || bgColor === '#1a1a1a' || bgColor === '#000000' || 
                   (bgColor.startsWith('#') && parseInt(bgColor.substring(1, 3), 16) < 120);

  const defaultDark = isDarkBg;

  let fontLink = '';
  if (fontFamily === 'Poppins') {
    fontLink = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
  } else if (fontFamily === 'Montserrat') {
    fontLink = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap';
  } else if (fontFamily === 'Playfair Display') {
    fontLink = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';
  }

  // Generate Today's schedule text for the closed banner
  const todayHours = businessHours.find(h => h.dayOfWeek === todayDay);
  let todayHoursText = '';
  if (!todayHours || !todayHours.isOpen) {
    todayHoursText = 'Cerrado por el día de hoy.';
  } else {
    const shifts = [];
    if (todayHours.shift1Open && todayHours.shift1Close) {
      shifts.push(`${todayHours.shift1Open} a ${todayHours.shift1Close}`);
    }
    if (todayHours.shift2Open && todayHours.shift2Close) {
      shifts.push(`${todayHours.shift2Open} a ${todayHours.shift2Close}`);
    }
    todayHoursText = `Horario de hoy: ${shifts.join(' y ')}`;
  }

  return (
    <ThemeProvider defaultDark={defaultDark}>
      <ClientThemeWrapper config={{ themeColor, buttonColor, bgColor, cardColor, textColor, fontFamily }}>
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
          <p className="text-muted">{config.subtitle || 'Delivery & Takeaway'}</p>

          {/* Social Buttons + Theme Toggle */}
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

            <ThemeToggle />
          </div>
        </header>

        {!isOpen && (
          <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', marginBottom: '2rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ marginBottom: '0.25rem' }}>Lo sentimos, en este momento el local se encuentra cerrado.</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 'normal', opacity: 0.9 }}>{todayHoursText}</p>
          </div>
        )}

        <div className="container" style={{ paddingBottom: '3rem' }}>
          <Catalog 
          products={products as any} 
          categories={categories as any}
          banners={banners}
          whatsappNumber={config.whatsappNumber}
          isOpen={isOpen}
          slug={restaurant.slug}
          cardLayout={config.cardLayout || 'grid'}
          bankAlias={config.bankAlias || ''}
          shippingFee={config.shippingFee || 0}
        />
        </div>
      </ClientThemeWrapper>
    </ThemeProvider>
  );
}
