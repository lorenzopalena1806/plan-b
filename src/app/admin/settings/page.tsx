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

  const applyPreset = (preset: 'light' | 'dark' | 'sepia') => {
    if (!config) return;
    if (preset === 'light') {
      setConfig({
        ...config,
        themeColor: '#e11d48',
        bgColor: '#ffffff',
        cardColor: '#ffffff',
        textColor: '#1a1a1a'
      });
    } else if (preset === 'dark') {
      setConfig({
        ...config,
        themeColor: '#e11d48',
        bgColor: '#121212',
        cardColor: '#1e1e1e',
        textColor: '#ffffff'
      });
    } else if (preset === 'sepia') {
      setConfig({
        ...config,
        themeColor: '#c2410c',
        bgColor: '#faf7f0',
        cardColor: '#f4efe6',
        textColor: '#431407'
      });
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

        {/* Brand identity: logo, font, card layout */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Identidad Visual</h3>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>URL del Logo (Opcional)</label>
              {config?.logoUrl && (
                <img src={config.logoUrl} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '1rem', display: 'block', borderRadius: 'var(--border-radius-sm)' }} />
              )}
              <input 
                type="url" 
                placeholder="https://ejemplo.com/mi-logo.png"
                value={config?.logoUrl || ''}
                onChange={e => setConfig({...config, logoUrl: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              />
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pega el enlace de internet de tu imagen.</p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Tipografía (Google Font)</label>
                <select
                  value={config?.fontFamily || 'Inter'}
                  onChange={e => setConfig({...config, fontFamily: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', height: '46px' }}
                >
                  <option value="Inter">Inter (Moderna)</option>
                  <option value="Poppins">Poppins (Redondeada / Amigable)</option>
                  <option value="Montserrat">Montserrat (Geométrica / Limpia)</option>
                  <option value="Playfair Display">Playfair Display (Elegante)</option>
                </select>
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Diseño de Catálogo</label>
                <select
                  value={config?.cardLayout || 'grid'}
                  onChange={e => setConfig({...config, cardLayout: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', height: '46px' }}
                >
                  <option value="grid">Cuadrícula (2 columnas)</option>
                  <option value="list">Lista Compacta (1 columna)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Colors and Theme Customization */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h3 className="text-bold" style={{ fontSize: '1.1rem' }}>Paleta de Colores</h3>
            <div className="flex" style={{ gap: '0.5rem' }}>
              <button type="button" className="btn-outline" onClick={() => applyPreset('light')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>☀️ Claro</button>
              <button type="button" className="btn-outline" onClick={() => applyPreset('dark')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>🌙 Oscuro</button>
              <button type="button" className="btn-outline" onClick={() => applyPreset('sepia')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>☕ Sepia</button>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Botones y Acentos</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={config?.themeColor || '#e11d48'} 
                  onChange={e => setConfig({...config, themeColor: e.target.value})}
                  style={{ width: '45px', height: '35px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                />
                <span className="text-muted font-mono" style={{ fontSize: '0.85rem' }}>{config?.themeColor || '#e11d48'}</span>
              </div>
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Fondo del Sitio</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={config?.bgColor || '#ffffff'} 
                  onChange={e => setConfig({...config, bgColor: e.target.value})}
                  style={{ width: '45px', height: '35px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                />
                <span className="text-muted font-mono" style={{ fontSize: '0.85rem' }}>{config?.bgColor || '#ffffff'}</span>
              </div>
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Fondo de Tarjetas y Modales</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={config?.cardColor || '#ffffff'} 
                  onChange={e => setConfig({...config, cardColor: e.target.value})}
                  style={{ width: '45px', height: '35px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                />
                <span className="text-muted font-mono" style={{ fontSize: '0.85rem' }}>{config?.cardColor || '#ffffff'}</span>
              </div>
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Color del Texto</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={config?.textColor || '#1a1a1a'} 
                  onChange={e => setConfig({...config, textColor: e.target.value})}
                  style={{ width: '45px', height: '35px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                />
                <span className="text-muted font-mono" style={{ fontSize: '0.85rem' }}>{config?.textColor || '#1a1a1a'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Info */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Métodos de Pago</h3>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Alias para Transferencias (CBU/CVU/MercadoPago)</label>
            <input 
              type="text" 
              placeholder="ej: mi.local.mp"
              value={config?.bankAlias || ''} 
              onChange={e => setConfig({...config, bankAlias: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
            />
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Si completas este campo, los clientes podrán elegir pagar con Transferencia y se les mostrará este alias al finalizar.</p>
          </div>
        </div>

        {/* Operating Hours */}
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

        <label className="flex items-center" style={{ gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'var(--color-border)', opacity: 0.8, border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}>
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
