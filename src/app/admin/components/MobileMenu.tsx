'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu({ businessType, role, subscriptionEnd, userName }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="hide-on-desktop">
      <button onClick={() => setIsOpen(true)} style={{ fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
        ☰
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={() => setIsOpen(false)}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '280px', height: '100%', backgroundColor: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Menú Principal</span>
              <button onClick={() => setIsOpen(false)} style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/admin" onClick={() => setIsOpen(false)} style={{ padding: '0.75rem', textDecoration: 'none', color: '#333', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #eee' }}>📊 Inicio / Panel</Link>
              <Link href="/admin/caja" onClick={() => setIsOpen(false)} style={{ padding: '0.75rem', textDecoration: 'none', color: '#333', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #eee' }}>{businessType === 'RESTAURANT' ? '💵 Caja' : '🛒 Caja / Pedidos'}</Link>
              <Link href="/admin/comandera" onClick={() => setIsOpen(false)} style={{ padding: '0.75rem', textDecoration: 'none', color: '#333', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #eee' }}>{businessType === 'RESTAURANT' ? '👨‍🍳 Comandera' : '📦 Armado de Pedidos'}</Link>
              <Link href="/admin/settings" onClick={() => setIsOpen(false)} style={{ padding: '0.75rem', textDecoration: 'none', color: '#333', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #eee' }}>⚙️ Configuración</Link>
            </div>
            
            <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subscriptionEnd && (
                <div style={{ fontSize: '0.85rem', color: '#666', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
                  📅 Vence: {new Date(subscriptionEnd).toLocaleDateString('es-AR')}
                </div>
              )}
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Usuario: {userName}</span>
              {role === 'SUPERADMIN' && (
                <Link href="/developer" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>Volver a SuperAdmin</Link>
              )}
              <Link href="/api/auth/signout" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'var(--color-red-primary)', fontWeight: 'bold' }}>Cerrar Sesión</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
