'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ModifierOption {
  id: number;
  name: string;
  price: number;
  type: string; // 'FREE' | 'PAID'
}

export default function ModifiersPage() {
  const [modifiers, setModifiers] = useState<ModifierOption[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [type, setType] = useState('FREE');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchModifiers();
  }, []);

  const fetchModifiers = async () => {
    try {
      const res = await fetch('/api/modifiers');
      if (res.ok) {
        const data = await res.json();
        setModifiers(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/modifiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: type === 'FREE' ? 0 : price,
          type
        })
      });

      if (res.ok) {
        setName('');
        setPrice(0);
        setType('FREE');
        fetchModifiers();
      } else {
        alert('Error al agregar el modificador');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este modificador? Se desvinculará de todos los productos que lo usen.')) return;

    try {
      const res = await fetch(`/api/modifiers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModifiers(modifiers.filter(m => m.id !== id));
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '700px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <h1>Modificadores Reutilizables</h1>
        <Link href="/admin" className="btn-outline">Volver al Panel</Link>
      </header>

      <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Nuevo Modificador</h2>
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Nombre</label>
            <input
              type="text"
              placeholder="Ej: Sin Cebolla, Extra Queso"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
            />
          </div>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Tipo</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', height: '38px' }}
            >
              <option value="FREE">Gratuito (Sacar)</option>
              <option value="PAID">Adicional Pago</option>
            </select>
          </div>
          <div>
            {type === 'PAID' && (
              <>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Precio Extra</label>
                <input
                  type="number"
                  placeholder="Precio"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  required
                  min="0"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </>
            )}
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Modificador'}
        </button>
      </form>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Modificadores Disponibles ({modifiers.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {modifiers.map(mod => (
            <div key={mod.id} className="flex justify-between items-center" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span className="text-bold" style={{ fontSize: '1rem' }}>{mod.name}</span>
                <span className={`status-badge ${mod.type === 'FREE' ? 'bg-red-light text-red' : 'status-ready'}`} style={{ marginLeft: '0.75rem', fontSize: '0.75rem', padding: '0.125rem 0.375rem' }}>
                  {mod.type === 'FREE' ? 'Sin Costo' : `+$${mod.price}`}
                </span>
              </div>
              <button
                onClick={() => handleDelete(mod.id)}
                className="text-red text-bold"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Eliminar
              </button>
            </div>
          ))}
          {modifiers.length === 0 && <p className="text-muted text-center">No hay modificadores cargados.</p>}
        </div>
      </div>
    </div>
  );
}
