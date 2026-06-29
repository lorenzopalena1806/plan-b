'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DriverWithTrips {
  id: number;
  name: string;
  phone: string;
  isActive: boolean;
  user?: { username: string };
  tripsToday?: number;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverWithTrips[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', isActive: true, username: '', password: '' });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDriver, setHistoryDriver] = useState<any>(null);
  const [driverHistory, setDriverHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
    setFormData({ name: '', phone: '', isActive: true, username: '', password: '' });
    setIsModalOpen(true);
  };

  const openEdit = (driver: any) => {
    setEditingDriver(driver);
    setFormData({ 
      name: driver.name, 
      phone: driver.phone, 
      isActive: driver.isActive,
      username: driver.user?.username || '',
      password: '' // empty password so we don't show the hashed one
    });
    setIsModalOpen(true);
  };

  const openHistory = async (driver: any) => {
    setHistoryDriver(driver);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/drivers/${driver.id}/history`);
      if (res.ok) {
        setDriverHistory(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingHistory(false);
    }
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
                <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  🛵 Viajes hoy: {driver.tripsToday || 0}
                </div>
              </div>
              <span className={driver.isActive ? 'text-green' : 'text-red'} style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                {driver.isActive ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>
            
            <div className="flex" style={{ gap: '0.5rem', marginTop: 'auto' }}>
              <button className="btn-outline" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => openEdit(driver)}>Editar</button>
              <button className="btn-outline" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem', borderColor: '#0369a1', color: '#0369a1' }} onClick={() => openHistory(driver)}>Historial</button>
              <button className="btn-outline" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem', borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => deleteDriver(driver.id)}>Eliminar</button>
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

            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h3 className="text-bold" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Acceso al Portal</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Crea un usuario para que el cadete pueda ingresar y ver sus entregas.</p>
              
              <div style={{ marginBottom: '1rem' }}>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Usuario</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required={!editingDriver}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </div>

              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingDriver}
                  placeholder={editingDriver ? "Dejar en blanco para mantener actual" : ""}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </div>
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
            
            <div className="flex justify-end" style={{ gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {isHistoryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card flex-col" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', background: 'var(--color-bg)', padding: '1.5rem', overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 className="text-bold">Historial de {historyDriver?.name}</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>×</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cargando historial...</div>
              ) : driverHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No hay viajes completados registrados.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha y Hora</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverHistory.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>#{order.id}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {new Date(order.createdAt).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {order.customerName}<br/>
                          <span style={{ color: '#666', fontSize: '0.75rem' }}>{order.address}</span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-green)' }}>
                          ${order.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div style={{ textAlign: 'center', color: '#666', fontSize: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              Mostrando los últimos 50 viajes entregados
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
