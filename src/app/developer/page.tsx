'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export default function DeveloperDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/restaurants');
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      if (res.ok) {
        setName('');
        setSlug('');
        fetchRestaurants();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando...</div>;

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Locales (Restaurantes)</h2>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Añadir Nuevo Local</h3>
        <form onSubmit={handleCreate} className="grid" style={{ gap: '1.5rem' }}>
          {error && <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>{error}</div>}
          
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre del Local</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                placeholder="Ej: Hamburguesas Pepe"
                required
              />
            </div>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>URL (Slug)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                placeholder="ej: hamburguesas-pepe"
                pattern="[a-z0-9-]+"
                title="Solo minúsculas, números y guiones medios"
                required
              />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                La URL será: misistema.com/<strong>{slug || '...'}</strong>
              </p>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: 'max-content' }}>
            Crear Local
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Slug (URL)</th>
              <th style={{ padding: '1rem' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                  No hay locales registrados.
                </td>
              </tr>
            ) : (
              restaurants.map((rest) => (
                <tr key={rest.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem' }}>{rest.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{rest.name}</td>
                  <td style={{ padding: '1rem' }} className="text-red font-mono">/{rest.slug}</td>
                  <td style={{ padding: '1rem' }} className="text-muted">
                    {new Date(rest.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
