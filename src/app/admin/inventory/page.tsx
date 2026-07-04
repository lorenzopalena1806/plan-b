'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Ingredient = {
  id: number;
  name: string;
  stockUnit: string;
  currentStock: number;
  unitCost: number;
};

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  
  const [name, setName] = useState('');
  const [stockUnit, setStockUnit] = useState('gr');
  const [currentStock, setCurrentStock] = useState('0');
  const [unitCost, setUnitCost] = useState('0');

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/admin/ingredients');
      if (res.ok) setIngredients(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleOpenModal = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setName(ingredient.name);
      setStockUnit(ingredient.stockUnit);
      setCurrentStock(ingredient.currentStock.toString());
      setUnitCost(ingredient.unitCost.toString());
    } else {
      setEditingIngredient(null);
      setName('');
      setStockUnit('gr');
      setCurrentStock('0');
      setUnitCost('0');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const payload = { name, stockUnit, currentStock, unitCost };
      const url = editingIngredient 
        ? `/api/admin/ingredients/${editingIngredient.id}` 
        : '/api/admin/ingredients';
      const method = editingIngredient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchIngredients();
      } else {
        alert('Error al guardar ingrediente');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este ingrediente?')) return;
    try {
      const res = await fetch(`/api/admin/ingredients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchIngredients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando inventario...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="mobile-header-stack" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h1 className="text-red">Inventario de Ingredientes</h1>
        <div className="flex" style={{ gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => handleOpenModal()}>+ Nuevo Ingrediente</button>
          <Link href="/admin" className="btn-outline">Ir a Admin</Link>
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Ingrediente</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Unidad</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Stock Actual</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Costo por Unidad</th>
              <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ing => (
              <tr key={ing.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}><strong>{ing.name}</strong></td>
                <td style={{ padding: '1rem' }}>{ing.stockUnit}</td>
                <td style={{ padding: '1rem', color: ing.currentStock <= 0 ? 'var(--color-red-primary)' : 'inherit', fontWeight: ing.currentStock <= 0 ? 'bold' : 'normal' }}>
                  {ing.currentStock} {ing.stockUnit}
                </td>
                <td style={{ padding: '1rem' }}>${ing.unitCost.toLocaleString()}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button className="btn-outline" onClick={() => handleOpenModal(ing)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Editar / Cargar Stock</button>
                  <button className="text-muted" onClick={() => handleDelete(ing.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No hay ingredientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h2 className="text-bold" style={{ marginBottom: '1rem' }}>
              {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Carne de Hamburguesa" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Unidad de Medida</label>
              <select value={stockUnit} onChange={e => setStockUnit(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="gr">Gramos (gr)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="l">Litros (l)</option>
                <option value="unidades">Unidades (un)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Stock Actual</label>
                <input type="number" step="0.01" value={currentStock} onChange={e => setCurrentStock(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Costo x Unidad ($)</label>
                <input type="number" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
