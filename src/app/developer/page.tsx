'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  businessType: string;
  subscriptionEnd?: string | null;
  configs?: { isSuspended: boolean }[];
}

export default function DeveloperDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [businessType, setBusinessType] = useState('RESTAURANT');
  const [supportContact, setSupportContact] = useState('');
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDates, setPendingDates] = useState<Record<number, string>>({});

  // Receipts State
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptPeriodStart, setReceiptPeriodStart] = useState('');
  const [receiptPeriodEnd, setReceiptPeriodEnd] = useState('');
  const [receiptDesc, setReceiptDesc] = useState('');
  const [receiptRestId, setReceiptRestId] = useState('');

  useEffect(() => {
    fetchRestaurants();
    fetchSupportConfig();
    fetchReceipts();
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

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/developer/receipts');
      if (res.ok) {
        const data = await res.json();
        setReceipts(data);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, businessType }),
      });

      if (res.ok) {
        setName('');
        setSlug('');
        setBusinessType('RESTAURANT');
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

  const handleDeleteRestaurant = async (id: number) => {
    const confirm = window.confirm('¡ATENCIÓN! ¿Estás absolutamente seguro de que quieres eliminar este local por completo? Se perderán todos sus datos y no se podrá deshacer.');
    if (!confirm) return;
    
    try {
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRestaurants(restaurants.filter(r => r.id !== id));
        alert('Local eliminado correctamente.');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el local.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleUpdateSubscription = async (id: number, dateStr: string) => {
    try {
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

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptNumber.trim() || !receiptAmount || !receiptPeriodStart || !receiptPeriodEnd || !receiptRestId) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    setIsSavingReceipt(true);
    try {
      const res = await fetch('/api/developer/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber: receiptNumber.trim(),
          amount: parseFloat(receiptAmount),
          periodStart: receiptPeriodStart,
          periodEnd: receiptPeriodEnd,
          description: receiptDesc.trim() || null,
          restaurantId: parseInt(receiptRestId)
        })
      });

      if (res.ok) {
        setReceiptNumber('');
        setReceiptAmount('');
        setReceiptPeriodStart('');
        setReceiptPeriodEnd('');
        setReceiptDesc('');
        setReceiptRestId('');
        fetchReceipts();
        alert('Recibo emitido con éxito.');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al emitir el recibo.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al emitir recibo.');
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este recibo?')) return;
    try {
      const res = await fetch(`/api/developer/receipts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReceipts(receipts.filter(r => r.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el recibo.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar recibo.');
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

      {/* Grid 1: Create Restaurant and Support Settings */}
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
            
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Rubro (Tipo de Negocio)</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
              >
                <option value="RESTAURANT">🍔 Restaurante / Comidas</option>
                <option value="GROCERY">🍎 Verdulería / Almacén</option>
                <option value="PHARMACY">💊 Farmacia</option>
                <option value="BUTCHER">🥩 Carnicería</option>
                <option value="KIOSK">🍬 Kiosco / Minimarket</option>
                <option value="OTHER">📦 Otro</option>
              </select>
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

      {/* Grid 2: Emit Receipt and Emitted Receipts History */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem', alignItems: 'start' }}>
        
        {/* Emit Receipt Form */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Emitir Recibo de Pago</h3>
          <form onSubmit={handleCreateReceipt} className="grid" style={{ gap: '0.75rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Local / Restaurante</label>
              <select
                value={receiptRestId}
                onChange={e => setReceiptRestId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', height: '38px' }}
                required
              >
                <option value="">Seleccionar local...</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (/{r.slug})</option>
                ))}
              </select>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Nro de Recibo</label>
                <input
                  type="text"
                  placeholder="Ej: REC-0001"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Monto ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 5000"
                  min="0"
                  step="any"
                  value={receiptAmount}
                  onChange={e => setReceiptAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  required
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Inicio Período</label>
                <input
                  type="date"
                  value={receiptPeriodStart}
                  onChange={e => setReceiptPeriodStart(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                  required
                />
              </div>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Fin Período</label>
                <input
                  type="date"
                  value={receiptPeriodEnd}
                  onChange={e => setReceiptPeriodEnd(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Nota / Comentario (Opcional)</label>
              <textarea
                placeholder="Ej: Suscripción mensual"
                value={receiptDesc}
                onChange={e => setReceiptDesc(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.25rem' }} disabled={isSavingReceipt}>
              {isSavingReceipt ? 'Emitiendo...' : 'Emitir Recibo'}
            </button>
          </form>
        </div>

        {/* Emitted Receipts Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', fontSize: '1.1rem' }}>Historial de Recibos Emitidos</h3>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-border)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ padding: '0.75rem' }}>Nro</th>
                  <th style={{ padding: '0.75rem' }}>Local</th>
                  <th style={{ padding: '0.75rem' }}>Monto</th>
                  <th style={{ padding: '0.75rem' }}>Período</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center' }} className="text-muted">
                      No se han emitido recibos de pago.
                    </td>
                  </tr>
                ) : (
                  receipts.map(rec => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }} className="font-mono text-red">{rec.receiptNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{rec.restaurant?.name || `ID #${rec.restaurantId}`}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>${rec.amount.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem' }} className="text-muted">
                        {new Date(rec.periodStart).toLocaleDateString('es-AR')} - {new Date(rec.periodEnd).toLocaleDateString('es-AR')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteReceipt(rec.id)}
                          className="text-red"
                          style={{ fontWeight: 'bold', textDecoration: 'underline' }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Restaurants List Table */}
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Listado de Locales y Suscripciones</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Slug (URL)</th>
              <th style={{ padding: '1rem' }}>Rubro</th>
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
                  <td style={{ padding: '1rem' }}>
                    <span className="status-badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '0.75rem' }}>
                      {rest.businessType || 'RESTAURANT'}
                    </span>
                  </td>
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
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                          
                          <button 
                            onClick={() => handleDeleteRestaurant(rest.id)}
                            className="btn-primary"
                            style={{ 
                              padding: '0.5rem 1rem', 
                              fontSize: '0.85rem',
                              backgroundColor: 'var(--color-red-primary)',
                              borderColor: 'var(--color-red-primary)',
                              color: 'white'
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
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
