'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  subscriptionEnd?: string | null;
  configs?: { isSuspended: boolean }[];
}

export default function DeveloperDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [supportContact, setSupportContact] = useState('');
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDates, setPendingDates] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchRestaurants();
    fetchSupportConfig();
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

  const fetchSupportConfig = async () => {
    try {
      const res = await fetch('/api/developer/config');
      if (res.ok) {
        const data = await res.json();
        setSupportContact(data.supportContact || '');
      }
    } catch (err) {
      console.error(err);
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

  const toggleSuspend = async (id: number, currentStatus: boolean) => {
    try {
      // Optimistic update
      setRestaurants(restaurants.map(r => 
        r.id === id ? { ...r, configs: [{ isSuspended: !currentStatus }] } : r
      ));
      
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: !currentStatus }),
      });

      if (!res.ok) {
        fetchRestaurants(); // Revert on failure
      }
    } catch (err) {
      console.error(err);
      fetchRestaurants();
    }
  };

  const handleUpdateSubscription = async (id: number, dateStr: string) => {
    try {
      // Safe optimistic update using ISO-compliant string formatting directly
      const localIso = dateStr ? `${dateStr}T00:00:00.000Z` : null;
      setRestaurants(restaurants.map(r => 
        r.id === id ? { ...r, subscriptionEnd: localIso } : r
      ));
      
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionEnd: dateStr ? `${dateStr}T23:59:59.000Z` : null }),
      });

      if (res.ok) {
        // Clear pending date state upon success
        setPendingDates(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error al actualizar suscripción: ${res.status} ${errData.error || ''}`);
        fetchRestaurants();
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al actualizar la suscripción');
      fetchRestaurants();
    }
  };

  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSupport(true);
    try {
      const res = await fetch('/api/developer/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supportContact })
      });
      if (res.ok) {
        alert('Contacto de soporte actualizado correctamente');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error al actualizar soporte: ${res.status} ${errData.error || ''}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar el contacto');
    } finally {
      setIsSavingSupport(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/developer/backup');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_polosandia_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error al descargar el backup: ${res.status} ${errData.error || ''}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al descargar backup');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando...</div>;

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Locales (Restaurantes)</h2>
        <button 
          onClick={handleDownloadBackup}
          className="btn-outline" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
        >
          📥 Descargar Backup JSON
        </button>
      </header>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', alignItems: 'start' }}>
        
        {/* Create Restaurant Form */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Añadir Nuevo Local</h3>
          <form onSubmit={handleCreate} className="grid" style={{ gap: '1rem' }}>
            {error && <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>{error}</div>}
            
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
            
            <button type="submit" className="btn-primary" style={{ width: 'max-content', marginTop: '0.5rem' }}>
              Crear Local
            </button>
          </form>
        </div>

        {/* Global Support Settings Form */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Configuración Global de Soporte</h3>
          <form onSubmit={handleSaveSupport} className="grid" style={{ gap: '1rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Enlace de Soporte Técnico (WhatsApp o Web)</label>
              <input
                type="text"
                value={supportContact}
                onChange={(e) => setSupportContact(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                placeholder="Ej: https://wa.me/5491123456789 o wa.me/5491123456789"
                required
              />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Este enlace se mostrará en el pie de página del panel de todos los locales comerciales.
              </p>
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: 'max-content', marginTop: '0.5rem' }} disabled={isSavingSupport}>
              {isSavingSupport ? 'Guardando...' : 'Guardar Contacto'}
            </button>
          </form>
        </div>

      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Slug (URL)</th>
              <th style={{ padding: '1rem' }}>Fecha</th>
              <th style={{ padding: '1rem' }}>Suscripción Vence</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Estado / Acciones</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
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
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    {(() => {
                      const savedDate = rest.subscriptionEnd ? new Date(rest.subscriptionEnd).toISOString().split('T')[0] : '';
                      const pendingDate = pendingDates[rest.id];
                      const displayValue = pendingDate !== undefined ? pendingDate : savedDate;
                      const hasChanged = pendingDate !== undefined && pendingDate !== savedDate;
                      
                      return (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="date"
                            value={displayValue}
                            onChange={e => setPendingDates({ ...pendingDates, [rest.id]: e.target.value })}
                            style={{ padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                          />
                          {hasChanged && (
                            <button
                              onClick={() => handleUpdateSubscription(rest.id, pendingDate)}
                              className="btn-primary"
                              style={{
                                padding: '0.3rem 0.5rem',
                                marginLeft: '0.5rem',
                                fontSize: '0.75rem',
                                width: 'auto',
                                backgroundColor: 'var(--color-green)',
                                borderColor: 'var(--color-green)'
                              }}
                            >
                              Confirmar
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {(() => {
                      const isSuspended = rest.configs && rest.configs.length > 0 ? rest.configs[0].isSuspended : false;
                      return (
                        <button 
                          onClick={() => toggleSuspend(rest.id, isSuspended)}
                          className={isSuspended ? "btn-primary" : "btn-outline"}
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.85rem',
                            backgroundColor: isSuspended ? '#721c24' : 'transparent',
                            borderColor: '#721c24',
                            color: isSuspended ? 'white' : '#721c24'
                          }}
                        >
                          {isSuspended ? 'Restaurar' : 'Suspender'}
                        </button>
                      );
                    })()}
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
