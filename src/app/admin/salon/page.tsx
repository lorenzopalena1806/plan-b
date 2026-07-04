'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type OrderItem = any;
type Order = {
  id: number;
  total: number;
  items: OrderItem[];
};

type Table = {
  id: number;
  number: number;
  status: string;
  orders: Order[];
};

export default function SalonPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(() => {
      if (!document.hidden) fetchTables();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTable = async () => {
    if (!newTableNumber) return;
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: newTableNumber })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTableNumber('');
        fetchTables();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al agregar mesa');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTable = async (tableId: number) => {
    try {
      await fetch(`/api/admin/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN' })
      });
      fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if(!confirm('¿Estás seguro de eliminar esta mesa?')) return;
    try {
      await fetch(`/api/admin/tables/${tableId}`, { method: 'DELETE' });
      fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseTable = async (tableId: number) => {
    if (!confirm('¿Cerrar mesa y marcar como pagada? (Cobra en efectivo por defecto. Ve a Caja si necesitas otro método)')) return;
    try {
      await fetch(`/api/admin/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE', paymentMethod: 'CASH' })
      });
      fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando salón...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="mobile-header-stack" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h1 className="text-red">Módulo de Salón</h1>
        <div className="flex" style={{ gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={fetchTables}>Refrescar</button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Agregar Mesa</button>
          <Link href="/admin" className="btn-outline">Ir a Admin</Link>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {tables.map(table => {
          const isOccupied = table.status === 'OCCUPIED' || table.orders.length > 0;
          const totalUnpaid = table.orders.reduce((sum, o) => sum + o.total, 0);

          return (
            <div key={table.id} className="card" style={{ 
              borderTop: `6px solid ${isOccupied ? 'var(--color-red-primary)' : 'var(--color-green)'}`,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '200px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '2rem', margin: 0, lineHeight: 1 }}>#{table.number}</h2>
                  <span className="status-badge" style={{ backgroundColor: isOccupied ? 'var(--color-red-light)' : 'var(--color-green-light)', color: isOccupied ? 'var(--color-red-primary)' : 'var(--color-green)' }}>
                    {isOccupied ? 'OCUPADA' : 'LIBRE'}
                  </span>
                </div>
                
                {isOccupied && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Consumo actual:</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${totalUnpaid.toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>({table.orders.length} pedidos)</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                {isOccupied ? (
                  <>
                    <Link href={`/admin/caja/pos?tableId=${table.id}`} className="btn-outline" style={{ textAlign: 'center', borderColor: '#2563eb', color: '#2563eb' }}>
                      + Agregar Pedido
                    </Link>
                    <button className="btn-primary" onClick={() => handleCloseTable(table.id)} style={{ width: '100%', background: 'var(--color-green)' }}>
                      Cobrar y Liberar
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-outline" onClick={() => handleOpenTable(table.id)} style={{ width: '100%' }}>
                      Ocupar Mesa
                    </button>
                    <button className="text-muted" onClick={() => handleDeleteTable(table.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                      Eliminar Mesa
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {tables.length === 0 && (
          <p className="text-muted">No hay mesas configuradas en el salón.</p>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h2 className="text-bold" style={{ marginBottom: '1rem' }}>Agregar Mesa</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Número de Mesa</label>
              <input type="number" value={newTableNumber} onChange={e => setNewTableNumber(e.target.value)} placeholder="Ej: 1" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-outline" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddTable} style={{ flex: 1 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
