'use client';

import { useRouter } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';

function SwitcherInner({ 
  restaurants, 
  currentId 
}: { 
  restaurants: { id: number, name: string }[], 
  currentId: number | null 
}) {
  const router = useRouter();
  const { update } = useSession();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = parseInt(e.target.value);
    try {
      const res = await fetch('/api/users/me/active-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: newId })
      });
      if (res.ok) {
        // Actualizar la cookie de NextAuth antes de recargar
        await update({ restaurantId: newId });
        // Recargar la página completa para actualizar la sesión y todos los RSC
        window.location.reload();
      } else {
        alert('Error al cambiar de sucursal');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  if (!restaurants || restaurants.length <= 1) {
    return <span className="admin-title-mobile" style={{ fontWeight: 'normal', fontSize: '1.25rem', borderLeft: '1px solid #ccc', paddingLeft: '12px', color: '#555' }}>
      {restaurants[0]?.name || 'Mi Local'}
    </span>;
  }

  return (
    <div style={{ paddingLeft: '12px', borderLeft: '1px solid #ccc', display: 'flex', alignItems: 'center' }}>
      <select 
        value={currentId || ''} 
        onChange={handleChange}
        className="admin-title-mobile"
        style={{
          fontSize: '1.1rem', 
          fontWeight: '500', 
          border: 'none', 
          outline: 'none', 
          backgroundColor: 'transparent',
          cursor: 'pointer',
          color: 'var(--color-red-primary)'
        }}
      >
        {restaurants.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </div>
  );
}

export default function RestaurantSwitcher(props: any) {
  return (
    <SessionProvider>
      <SwitcherInner {...props} />
    </SessionProvider>
  );
}
