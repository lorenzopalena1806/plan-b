'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const isStaff = role === 'STAFF';

  const linkStyle = (path: string) => {
    const isActive = pathname === path || (path !== '/admin' && pathname.startsWith(path));
    return {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      textDecoration: 'none',
      color: isActive ? 'white' : 'var(--color-text)',
      backgroundColor: isActive ? 'var(--color-red-primary)' : 'transparent',
      fontWeight: isActive ? '600' : '500',
      transition: 'all 0.2s ease',
      marginBottom: '0.25rem'
    };
  };

  const groupStyle = {
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-light)',
    fontWeight: '700',
    marginTop: '1.5rem',
    marginBottom: '0.5rem',
    paddingLeft: '0.5rem',
    letterSpacing: '0.05em'
  };

  return (
    <aside className="hide-on-mobile" style={{
      width: '260px',
      backgroundColor: 'var(--color-card)',
      borderRight: '1px solid var(--color-border)',
      height: '100%',
      overflowY: 'auto',
      padding: '1.5rem 1rem',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Menú</h2>
      </div>

      <div style={groupStyle}>Operación</div>
      <Link href="/admin" style={linkStyle('/admin')}>📊 Panel Principal</Link>
      <Link href="/admin/caja" style={linkStyle('/admin/caja')}>💵 Caja</Link>
      <Link href="/admin/comandera" style={linkStyle('/admin/comandera')}>👨‍🍳 Comandera</Link>
      
      {!isStaff && (
        <>
          <Link href="/admin/salon" style={linkStyle('/admin/salon')}>🪑 Salón / Mesas</Link>
          <Link href="/admin/caja/pos" style={linkStyle('/admin/caja/pos')}>🛍️ Punto de Venta</Link>
          <Link href="/admin/sales" style={linkStyle('/admin/sales')}>📈 Ventas</Link>
          <Link href="/admin/billing" style={linkStyle('/admin/billing')}>🧾 Facturación</Link>

          <div style={groupStyle}>Catálogo</div>
          <Link href="/admin/products" style={linkStyle('/admin/products')}>🍔 Productos</Link>
          <Link href="/admin/categories" style={linkStyle('/admin/categories')}>📂 Categorías</Link>
          <Link href="/admin/modifiers" style={linkStyle('/admin/modifiers')}>➕ Modificadores</Link>
          <Link href="/admin/coupons" style={linkStyle('/admin/coupons')}>🎫 Cupones</Link>

          <div style={groupStyle}>Gestión</div>
          <Link href="/admin/inventory" style={linkStyle('/admin/inventory')}>📦 Inventario</Link>
          <Link href="/admin/users" style={linkStyle('/admin/users')}>👥 Personal</Link>
          <Link href="/admin/drivers" style={linkStyle('/admin/drivers')}>🛵 Repartidores</Link>
          <Link href="/admin/banners" style={linkStyle('/admin/banners')}>🖼️ Banners</Link>
          <Link href="/admin/settings" style={linkStyle('/admin/settings')}>⚙️ Configuración</Link>
        </>
      )}
    </aside>
  );
}
