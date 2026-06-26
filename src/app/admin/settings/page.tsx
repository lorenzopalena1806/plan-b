'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        setConfig((prev: any) => ({ ...prev, logoUrl: result.url }));
      } else {
        alert('Error al subir la imagen');
      }
    } catch (error) {
      console.error(error);
      alert('Error en la conexión al subir archivo');
    } finally {
      setIsUploading(false);
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

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Logo del Local (Opcional)</label>
            {config?.logoUrl && (
              <img src={config.logoUrl} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '1rem', display: 'block', borderRadius: 'var(--border-radius-sm)' }} />
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={handleUploadFile}
              disabled={isUploading}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
            />
            {isUploading && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Subiendo...</p>}
          </div>

          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Color Principal de tu Marca</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="color" 
                value={config?.themeColor || '#e11d48'} 
                onChange={e => setConfig({...config, themeColor: e.target.value})}
                style={{ width: '60px', height: '50px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
              />
              <span className="text-muted font-mono">{config?.themeColor || '#e11d48'}</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Este color se usará en los botones y textos del menú público.</p>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
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



        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}
