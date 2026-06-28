'use client';

import { useState, useEffect } from 'react';
import { Banner } from '@prisma/client';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({ imageUrl: '', link: '', isActive: true, orderIndex: 0 });

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        setBanners(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchBanners();
      } else {
        alert('Error al guardar el banner');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openNew = () => {
    setEditingBanner(null);
    setFormData({ imageUrl: '', link: '', isActive: true, orderIndex: banners.length });
    setIsModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({ imageUrl: banner.imageUrl, link: banner.link || '', isActive: banner.isActive, orderIndex: banner.orderIndex });
    setIsModalOpen(true);
  };

  const deleteBanner = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (res.ok) fetchBanners();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Carrusel de Banners</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Las imágenes que subas aquí irán rotando en la parte superior de tu menú digital.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Banner</button>
      </header>

      <div className="grid">
        {banners.length === 0 && (
          <div className="card text-center" style={{ gridColumn: '1 / -1' }}>
            No hay banners cargados. Agrega uno para activar el carrusel.
          </div>
        )}
        
        {banners.map(banner => (
          <div key={banner.id} className="card flex-col" style={{ gap: '1rem', display: 'flex', opacity: banner.isActive ? 1 : 0.6 }}>
            <div style={{ height: '150px', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={banner.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div className="flex justify-between items-center">
              <span className={banner.isActive ? 'text-green' : 'text-red'} style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                {banner.isActive ? 'ACTIVO' : 'INACTIVO'}
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Orden: {banner.orderIndex}</span>
            </div>
            
            {banner.link && <div className="text-muted" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>🔗 {banner.link}</div>}
            
            <div className="flex" style={{ gap: '0.5rem', marginTop: 'auto' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => openEdit(banner)}>Editar</button>
              <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => deleteBanner(banner.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} className="card flex-col" style={{ width: '90%', maxWidth: '400px', gap: '1.5rem', display: 'flex', background: 'var(--color-bg)' }}>
            <h2 className="text-bold">{editingBanner ? 'Editar' : 'Nuevo'} Banner</h2>
            
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>URL de la Imagen</label>
              <input 
                type="url" 
                placeholder="https://ejemplo.com/banner.png"
                value={formData.imageUrl} 
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              />
              {formData.imageUrl && (
                 <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', marginTop: '0.5rem', borderRadius: '4px' }} />
              )}
            </div>
            
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Enlace al hacer click (Opcional)</label>
              <input 
                type="text" 
                placeholder="/mis-promos o https://instagram.com"
                value={formData.link} 
                onChange={e => setFormData({...formData, link: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              />
            </div>

            <div className="flex" style={{ gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Orden</label>
                <input 
                  type="number" 
                  value={formData.orderIndex} 
                  onChange={e => setFormData({...formData, orderIndex: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '0.75rem' }}>
                <label className="flex items-center" style={{ gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <span className="text-bold">Activo</span>
                </label>
              </div>
            </div>
            
            <div className="flex" style={{ gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
              <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
