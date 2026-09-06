'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu({ role, subscriptionEnd, userName }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const isStaff = role === 'STAFF';

  const linkStyle = {
    padding: '0.75rem',
    textDecoration: 'none',
    color: '#333',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #eee'
  };

  const groupStyle = {
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    color: '#999',
    fontWeight: '700',
    marginTop: '1rem',
    marginBottom: '0.25rem',
    paddingLeft: '0.25rem',
    letterSpacing: '0.05em'
  };

  return (
    <div className="hide-on-desktop">
      <button onClick={() => setIsOpen(true)} style={{ fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
        ☰
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={() => setIsOpen(false)}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '100%', backgroundColor: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Menú Principal</span>
              <button onClick={() => setIsOpen(false)} style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={groupStyle}>Operación</div>
              <Link href="/admin" onClick={() => setIsOpen(false)} style={linkStyle}>📊 Panel Principal</Link>
              <Link href="/admin/caja" onClick={() => setIsOpen(false)} style={linkStyle}>💵 Caja</Link>
              <Link href="/admin/comandera" onClick={() => setIsOpen(false)} style={linkStyle}>👨‍🍳 Comandera</Link>
              
              {!isStaff && (
                <>
                  <Link href="/admin/salon" onClick={() => setIsOpen(false)} style={linkStyle}>🪑 Salón / Mesas</Link>
                  <Link href="/admin/caja/pos" onClick={() => setIsOpen(false)} style={linkStyle}>🛍️ Punto de Venta</Link>
                  <Link href="/admin/sales" onClick={() => setIsOpen(false)} style={linkStyle}>📈 Ventas</Link>
                  <Link href="/admin/billing" onClick={() => setIsOpen(false)} style={linkStyle}>🧾 Facturación</Link>

                  <div style={groupStyle}>Catálogo</div>
                  <Link href="/admin/products" onClick={() => setIsOpen(false)} style={linkStyle}>🍔 Productos</Link>
                  <Link href="/admin/categories" onClick={() => setIsOpen(false)} style={linkStyle}>📂 Categorías</Link>
                  <Link href="/admin/modifiers" onClick={() => setIsOpen(false)} style={linkStyle}>➕ Modificadores</Link>
                  <Link href="/admin/coupons" onClick={() => setIsOpen(false)} style={linkStyle}>🎫 Cupones</Link>

                  <div style={groupStyle}>Gestión</div>
                  <Link href="/admin/inventory" onClick={() => setIsOpen(false)} style={linkStyle}>📦 Inventario</Link>
                  <Link href="/admin/users" onClick={() => setIsOpen(false)} style={linkStyle}>👥 Personal</Link>
                  <Link href="/admin/drivers" onClick={() => setIsOpen(false)} style={linkStyle}>🛵 Repartidores</Link>
                  <Link href="/admin/banners" onClick={() => setIsOpen(false)} style={linkStyle}>🖼️ Banners</Link>
                  <Link href="/admin/settings" onClick={() => setIsOpen(false)} style={linkStyle}>⚙️ Configuración</Link>
                </>
              )}
            </div>
            
            <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subscriptionEnd && (
                <div style={{ fontSize: '0.85rem', color: '#666', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
                  📅 Vence: {new Date(subscriptionEnd).toLocaleDateString('es-AR')}
                </div>
              )}
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Usuario: {userName}</span>
              {role === 'SUPERADMIN' && (
                <Link href="/developer" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Volver a SuperAdmin</Link>
              )}
              <Link href="/api/auth/signout" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'var(--color-red-primary)', fontWeight: 'bold', padding: '0.5rem 0' }}>Cerrar Sesión</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
