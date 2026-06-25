'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Configuración guardada exitosamente');
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <h1>Configuración</h1>
        <Link href="/admin" className="btn-outline">Volver</Link>
      </header>

      <form onSubmit={handleSave} className="card flex-col" style={{ gap: '1.5rem', display: 'flex' }}>
        <div>
          <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Número de WhatsApp (con código de país)</label>
          <input 
            type="text" 
            value={config?.whatsappNumber || ''} 
            onChange={e => setConfig({...config, whatsappNumber: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
            required
          />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Horario de Apertura</label>
            <input 
              type="time" 
              value={config?.openTime || ''} 
              onChange={e => setConfig({...config, openTime: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              required
            />
          </div>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Horario de Cierre</label>
            <input 
              type="time" 
              value={config?.closeTime || ''} 
              onChange={e => setConfig({...config, closeTime: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              required
            />
          </div>
        </div>

        <label className="flex items-center" style={{ gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}>
          <input 
            type="checkbox" 
            checked={config?.isOpenOverride || false} 
            onChange={e => setConfig({...config, isOpenOverride: e.target.checked})}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-red-primary)' }}
          />
          <div>
            <div className="text-bold">Forzar estado del local</div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              Si se desmarca, el local aparecerá "Cerrado" sin importar el horario.
            </div>
          </div>
        </label>

        <label className="flex items-center" style={{ gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 'var(--border-radius-sm)', color: '#721c24' }}>
          <input 
            type="checkbox" 
            checked={config?.isSuspended || false} 
            onChange={e => setConfig({...config, isSuspended: e.target.checked})}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: '#721c24' }}
          />
          <div>
            <div className="text-bold">Suspender Sitio (Falta de Pago / Mantenimiento)</div>
            <div style={{ fontSize: '0.875rem' }}>
              Si se marca, el sitio entero dejará de funcionar para los clientes.
            </div>
          </div>
        </label>

        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}
