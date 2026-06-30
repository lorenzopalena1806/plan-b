'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function SettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Weekly hours state
  const [weeklyHours, setWeeklyHours] = useState<any[]>([]);
  const [isSavingHours, setIsSavingHours] = useState(false);

  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'hours' | 'qr'>('general');

  useEffect(() => {
    // Fetch general config
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setIsLoading(false);
      });

    // Fetch weekly hours
    fetch('/api/config/hours')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWeeklyHours(data);
        }
      })
      .catch(err => console.error('Error fetching weekly hours:', err));
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
        router.refresh();
        alert('Configuración guardada exitosamente');
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setIsSavingHours(true);
    try {
      const res = await fetch('/api/config/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weeklyHours)
      });
      if (res.ok) {
        alert('Horarios semanales guardados exitosamente');
      } else {
        alert('Error al guardar los horarios semanales');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setIsSavingHours(false);
    }
  };

  const handleDayToggle = (index: number) => {
    const next = [...weeklyHours];
    next[index] = { ...next[index], isOpen: !next[index].isOpen };
    setWeeklyHours(next);
  };

  const handleHourChange = (index: number, field: string, value: string) => {
    const next = [...weeklyHours];
    next[index] = { ...next[index], [field]: value || null };
    setWeeklyHours(next);
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
        buttonColor: '#f4efe6',
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

      <div className="flex-col" style={{ gap: '2rem', display: 'flex' }}>
        
        {/* Tabs Header */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--color-border)', marginBottom: '1rem', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('general')} 
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', borderBottom: activeTab === 'general' ? '3px solid var(--color-red-primary)' : '3px solid transparent', color: activeTab === 'general' ? 'var(--color-red-primary)' : '#666', cursor: 'pointer' }}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('design')} 
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', borderBottom: activeTab === 'design' ? '3px solid var(--color-red-primary)' : '3px solid transparent', color: activeTab === 'design' ? 'var(--color-red-primary)' : '#666', cursor: 'pointer' }}
          >
            Diseño
          </button>
          <button 
            onClick={() => setActiveTab('hours')} 
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', borderBottom: activeTab === 'hours' ? '3px solid var(--color-red-primary)' : '3px solid transparent', color: activeTab === 'hours' ? 'var(--color-red-primary)' : '#666', cursor: 'pointer' }}
          >
            Horarios
          </button>
          <button 
            onClick={() => setActiveTab('qr')} 
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', borderBottom: activeTab === 'qr' ? '3px solid var(--color-red-primary)' : '3px solid transparent', color: activeTab === 'qr' ? 'var(--color-red-primary)' : '#666', cursor: 'pointer' }}
          >
            Código QR
          </button>
        </div>

        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="card flex-col" style={{ gap: '1.5rem', display: 'flex' }}>
          {activeTab === 'general' && (
            <>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre del Local</label>
                <input 
                  type="text" 
                  value={config?.restaurantName || ''} 
                  onChange={e => setConfig({...config, restaurantName: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                  required
                />
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Subtítulo (ej: Delivery & Takeaway)</label>
                <input 
                  type="text" 
                  value={config?.subtitle || ''} 
                  onChange={e => setConfig({...config, subtitle: e.target.value})}
                  placeholder="Delivery & Takeaway"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </div>

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

              {/* Shipping Cost */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Costo de Envío</h3>
                <div>
                  <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Costo de Envío Fijo ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    placeholder="ej: 300"
                    value={config?.shippingFee || 0} 
                    onChange={e => setConfig({...config, shippingFee: parseFloat(e.target.value) || 0})}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                  />
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Este monto se sumará de forma automática al total de la compra cuando el cliente elija la opción de Envío a Domicilio.</p>
                </div>
              </div>

              {/* Social Links */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Enlaces y Redes Sociales</h3>
                <div className="grid" style={{ gap: '1rem' }}>
                  <div>
                    <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Enlace de Instagram (Opcional)</label>
                    <input 
                      type="url" 
                      placeholder="https://instagram.com/mi.local"
                      value={config?.instagramUrl || ''} 
                      onChange={e => setConfig({...config, instagramUrl: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                    />
                  </div>
                  <div>
                    <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Enlace de WhatsApp Directo (Opcional)</label>
                    <input 
                      type="url" 
                      placeholder="https://wa.me/5491123456789?text=Hola"
                      value={config?.whatsappUrl || ''} 
                      onChange={e => setConfig({...config, whatsappUrl: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                    />
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Si se deja vacío, se usará automáticamente el número de WhatsApp principal.</p>
                  </div>
                  <div>
                    <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Enlace de Google Maps (Opcional)</label>
                    <input 
                      type="url" 
                      placeholder="https://maps.google.com/?q=..."
                      value={config?.mapsUrl || ''} 
                      onChange={e => setConfig({...config, mapsUrl: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'design' && (
            <div style={{ paddingTop: '0.5rem' }}>
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
                    <option value="Montserrat">Montserrat (Geométrica / Limia)</option>
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
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Color Principal (Tema)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={config?.themeColor || '#e11d48'} 
                    onChange={e => setConfig({...config, themeColor: e.target.value})}
                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={config?.themeColor || '#e11d48'} 
                    onChange={e => setConfig({...config, themeColor: e.target.value})}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Color de Botones de Categorías</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={config?.buttonColor || '#ffffff'} 
                    onChange={e => setConfig({...config, buttonColor: e.target.value})}
                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={config?.buttonColor || '#ffffff'} 
                    onChange={e => setConfig({...config, buttonColor: e.target.value})}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Fondo del Sitio</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={config?.bgColor || '#ffffff'} 
                    onChange={e => setConfig({...config, bgColor: e.target.value})}
                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                  />
                  <input 
                    type="text" 
                    value={config?.bgColor || '#ffffff'} 
                    onChange={e => setConfig({...config, bgColor: e.target.value})}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Fondo de Tarjetas y Modales</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={config?.cardColor || '#ffffff'} 
                    onChange={e => setConfig({...config, cardColor: e.target.value})}
                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                  />
                  <input 
                    type="text" 
                    value={config?.cardColor || '#ffffff'} 
                    onChange={e => setConfig({...config, cardColor: e.target.value})}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Color del Texto</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={config?.textColor || '#1a1a1a'} 
                    onChange={e => setConfig({...config, textColor: e.target.value})}
                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }}
                  />
                  <input 
                    type="text" 
                    value={config?.textColor || '#1a1a1a'} 
                    onChange={e => setConfig({...config, textColor: e.target.value})}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          </div>

            </div>
          )}

          {activeTab === 'hours' && (
            <label className="flex items-center" style={{ gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'var(--color-border)', opacity: 0.8, border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}>
              <input 
                type="checkbox" 
                checked={config?.isOpenOverride || false} 
                onChange={e => setConfig({...config, isOpenOverride: e.target.checked})}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-red-primary)' }}
              />
              <div>
                <div className="text-bold">Forzar estado del local (Siempre Abierto)</div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Si se desmarca, el sistema usará los horarios semanales definidos abajo. Si está marcado, el local figura como abierto sin importar la hora.
                </div>
              </div>
            </label>
          )}

          {(activeTab === 'general' || activeTab === 'design' || activeTab === 'hours') && (
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          )}
        </form>

        {/* QR Code Section */}
        {activeTab === 'qr' && config?.restaurantSlug && (
          <div className="card flex-col" style={{ gap: '1.5rem', display: 'flex' }}>
            <div>
              <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Código QR de mi Menú</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Usa este código para imprimirlo en las mesas de tu local o en tus redes. Al escanearlo, tus clientes serán dirigidos automáticamente a tu menú digital.
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center" style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--color-border)' }}>
              {(() => {
                const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/${config.restaurantSlug}` : `https://polosandia.vercel.app/${config.restaurantSlug}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;
                return (
                  <>
                    <img src={qrUrl} alt="QR Code" style={{ width: '250px', height: '250px', marginBottom: '1rem' }} />
                    <p className="text-bold" style={{ marginBottom: '1rem' }}>{menuUrl}</p>
                    <a href={qrUrl} download={`qr-${config.restaurantSlug}.png`} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
                      ⬇️ Descargar Código QR
                    </a>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Weekly Business Hours Form */}
        {activeTab === 'hours' && (
          <div className="card flex-col" style={{ gap: '1.5rem', display: 'flex' }}>
          <div>
            <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Horarios por Día (Doble Turno)</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Define los horarios de apertura semanales. Soporta dos turnos diarios (ej: mediodía y noche). Los horarios cruzados de medianoche son soportados (ej: de 20:00 a 02:00).
            </p>
          </div>

          <div className="grid" style={{ gap: '1rem' }}>
            {weeklyHours.map((dayHour, idx) => (
              <div 
                key={dayHour.dayOfWeek} 
                className="card" 
                style={{ 
                  padding: '1rem', 
                  backgroundColor: dayHour.isOpen ? 'var(--color-card)' : '#f3f4f6', 
                  opacity: dayHour.isOpen ? 1 : 0.8,
                  borderColor: dayHour.isOpen ? 'var(--color-border)' : '#d1d5db'
                }}
              >
                <div className="flex justify-between items-center" style={{ marginBottom: dayHour.isOpen ? '0.75rem' : '0' }}>
                  <label className="flex items-center" style={{ gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={dayHour.isOpen}
                      onChange={() => handleDayToggle(idx)}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--color-red-primary)' }}
                    />
                    <strong style={{ fontSize: '0.95rem' }}>{DAY_NAMES[dayHour.dayOfWeek]}</strong>
                  </label>
                  <span className={dayHour.isOpen ? "text-green text-bold" : "text-muted"} style={{ fontSize: '0.85rem' }}>
                    {dayHour.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
                  </span>
                </div>

                {dayHour.isOpen && (
                  <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {/* Shift 1 */}
                    <div className="flex items-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', minWidth: '60px', fontWeight: '500' }}>Turno 1:</span>
                      <input 
                        type="time" 
                        value={dayHour.shift1Open || ''} 
                        onChange={e => handleHourChange(idx, 'shift1Open', e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
                      />
                      <span style={{ fontSize: '0.85rem' }}>a</span>
                      <input 
                        type="time" 
                        value={dayHour.shift1Close || ''} 
                        onChange={e => handleHourChange(idx, 'shift1Close', e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
                      />
                    </div>

                    {/* Shift 2 */}
                    <div className="flex items-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', minWidth: '60px', fontWeight: '500' }}>Turno 2:</span>
                      <input 
                        type="time" 
                        value={dayHour.shift2Open || ''} 
                        onChange={e => handleHourChange(idx, 'shift2Open', e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
                        placeholder="Ej: 20:00"
                      />
                      <span style={{ fontSize: '0.85rem' }}>a</span>
                      <input 
                        type="time" 
                        value={dayHour.shift2Close || ''} 
                        onChange={e => handleHourChange(idx, 'shift2Close', e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.875rem' }}
                        placeholder="Ej: 23:59"
                      />
                      {(dayHour.shift2Open || dayHour.shift2Close) && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const next = [...weeklyHours];
                            next[idx] = { ...next[idx], shift2Open: null, shift2Close: null };
                            setWeeklyHours(next);
                          }}
                          className="text-red"
                          style={{ fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem', textDecoration: 'underline' }}
                        >
                          Quitar Turno 2
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <button 
              type="button" 
              onClick={handleSaveHours} 
              disabled={isSavingHours}
              className="btn-primary" 
              style={{ 
                width: 'auto', 
                padding: '0.5rem 1.5rem', 
                fontSize: '0.875rem', 
                backgroundColor: 'var(--color-green)', 
                borderColor: 'var(--color-green)'
              }}
            >
              {isSavingHours ? 'Guardando Horarios...' : 'Confirmar Horarios Semanales'}
            </button>
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
