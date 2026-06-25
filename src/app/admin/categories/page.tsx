'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
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
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      if (res.ok) {
        setName('');
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al agregar la categoría');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <h1>Categorías</h1>
        <Link href="/admin" className="btn-outline">Volver al Panel</Link>
      </header>

      <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Nueva Categoría</h2>
        <div className="flex" style={{ gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Ej: Lomos, Pizzas, Bebidas"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Agregar'}
          </button>
        </div>
      </form>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Categorías Existentes ({categories.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-bold" style={{ fontSize: '1rem' }}>{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-red text-bold"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Eliminar
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-muted text-center">No hay categorías cargadas.</p>}
        </div>
      </div>
    </div>
  );
}
