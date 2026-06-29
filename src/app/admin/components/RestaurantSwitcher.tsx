'use client';

import { useRouter } from 'next/navigation';

export default function RestaurantSwitcher({ 
  restaurants, 
  currentId 
}: { 
  restaurants: { id: number, name: string }[], 
  currentId: number | null 
}) {
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    try {
      const res = await fetch('/api/users/me/active-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: newId })
      });
      if (res.ok) {
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
    return <span style={{ fontWeight: 'normal', fontSize: '1.25rem', borderLeft: '1px solid #ccc', paddingLeft: '12px', color: '#555' }}>
      {restaurants[0]?.name || 'Mi Local'}
    </span>;
  }

  return (
    <div style={{ paddingLeft: '12px', borderLeft: '1px solid #ccc', display: 'flex', alignItems: 'center' }}>
      <select 
        value={currentId || ''} 
        onChange={handleChange}
        style={{
          padding: '0.4rem 0.5rem',
          fontSize: '1.1rem',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          backgroundColor: '#f8f9fa',
          fontWeight: '500',
          color: '#333',
          cursor: 'pointer'
        }}
      >
        {restaurants.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </div>
  );
}
