'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CategoryDiscount {
  id?: number;
  quantity: number;
  price: number;
}

interface Category {
  id: number;
  name: string;
  discounts?: CategoryDiscount[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDiscounts, setEditDiscounts] = useState<CategoryDiscount[]>([]);

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

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDiscounts(cat.discounts || []);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          discounts: editDiscounts
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCategories();
      } else {
        alert('Error al guardar la categoría');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDiscountRow = () => {
    setEditDiscounts([...editDiscounts, { quantity: 0, price: 0 }]);
  };

  const updateDiscount = (index: number, field: keyof CategoryDiscount, value: number) => {
    const next = [...editDiscounts];
    next[index] = { ...next[index], [field]: value };
    setEditDiscounts(next);
  };

  const removeDiscount = (index: number) => {
    const next = [...editDiscounts];
    next.splice(index, 1);
    setEditDiscounts(next);
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
            <div key={cat.id} className="flex justify-between items-center" style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <div>
                <span className="text-bold" style={{ fontSize: '1rem', display: 'block' }}>{cat.name}</span>
                {cat.discounts && cat.discounts.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
                    {cat.discounts.length} promoción(es) por cantidad
                  </span>
                )}
              </div>
              <div className="flex" style={{ gap: '0.5rem' }}>
                <button
                  onClick={() => openEditModal(cat)}
                  className="btn-outline"
                  style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="btn-outline"
                  style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem', borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-muted text-center">No hay categorías cargadas.</p>}
        </div>
      </div>

      {isEditModalOpen && editingCategory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card flex-col" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 className="text-bold" style={{ fontSize: '1.25rem' }}>Editar Categoría</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-col" style={{ gap: '1.5rem' }}>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <h3 className="text-bold" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Descuentos por Cantidad</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Aplica precios especiales si el cliente compra N productos de esta categoría (ej: 6 empanadas a $5000, sin importar el sabor).
                </p>

                <div className="flex-col" style={{ gap: '0.75rem' }}>
                  {editDiscounts.map((d, index) => (
                    <div key={index} className="flex items-center" style={{ gap: '0.5rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', display: 'block' }}>Cant. Mínima</label>
                        <input
                          type="number"
                          min="2"
                          value={d.quantity || ''}
                          onChange={e => updateDiscount(index, 'quantity', parseInt(e.target.value) || 0)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', display: 'block' }}>Precio Final ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={d.price || ''}
                          onChange={e => updateDiscount(index, 'price', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeDiscount(index)}
                        style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--color-red-primary)', cursor: 'pointer', fontSize: '1.25rem' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={addDiscountRow}
                    className="btn-outline" 
                    style={{ fontSize: '0.85rem', padding: '0.5rem', marginTop: '0.5rem', borderStyle: 'dashed' }}
                  >
                    + Agregar Escala de Descuento
                  </button>
                </div>
              </div>

              <div className="flex justify-end" style={{ gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
