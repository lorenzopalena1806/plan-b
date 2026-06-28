'use client';

import { useState, useEffect } from 'react';
import { Driver } from '@prisma/client';
import Link from 'next/link';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', isActive: true });

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/admin/drivers');
      if (res.ok) {
        setDrivers(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDriver ? `/api/admin/drivers/${editingDriver.id}` : '/api/admin/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchDrivers();
      } else {
        alert('Error al guardar el repartidor');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openNew = () => {
    setEditingDriver(null);
    setFormData({ name: '', phone: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({ name: driver.name, phone: driver.phone, isActive: driver.isActive });
    setIsModalOpen(true);
  };

  const deleteDriver = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este repartidor?')) return;
    try {
      const res = await fetch(`/api/admin/drivers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchDrivers();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1>Repartidores (Delivery)</h1>
        <div className="flex" style={{ gap: '1rem' }}>
          <button className="btn-primary" onClick={openNew}>+ Nuevo Repartidor</button>
          <Link href="/admin" className="btn-outline">Volver al Panel</Link>
        </div>
      </header>

      <div className="grid">
        {drivers.length === 0 && (
          <div className="card text-center" style={{ gridColumn: '1 / -1' }}>
            No hay repartidores cargados.
          </div>
        )}
        
        {drivers.map(driver => (
          <div key={driver.id} className="card flex-col" style={{ gap: '1rem', display: 'flex', opacity: driver.isActive ? 1 : 0.6 }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-bold">{driver.name}</h3>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>📱 {driver.phone}</div>
              </div>
              <span className={driver.isActive ? 'text-green' : 'text-red'} style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                {driver.isActive ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>
            
            <div className="flex" style={{ gap: '0.5rem', marginTop: 'auto' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => openEdit(driver)}>Editar</button>
              <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => deleteDriver(driver.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleSubmit} className="card flex-col" style={{ width: '90%', maxWidth: '400px', gap: '1.5rem', display: 'flex', background: 'var(--color-bg)' }}>
            <h2 className="text-bold">{editingDriver ? 'Editar' : 'Nuevo'} Repartidor</h2>
            
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              />
            </div>
            
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono (WhatsApp)</label>
              <input 
                type="text" 
                placeholder="Ej: +5491123456789"
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              />
            </div>
            
            <label className="flex items-center" style={{ gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isActive} 
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
              <span className="text-bold">Activo (Disponible para repartir)</span>
            </label>
            
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
