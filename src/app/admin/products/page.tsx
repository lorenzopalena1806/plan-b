'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
}

interface ModifierOption {
  id: number;
  name: string;
  price: number;
  type: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: number | null;
  category?: Category | null;
  isPromo: boolean;
  modifiers: ModifierOption[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifiers, setModifiers] = useState<ModifierOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedModifierIds, setSelectedModifierIds] = useState<number[]>([]);
  const [isPromo, setIsPromo] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resProd, resCat, resMod] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/modifiers')
      ]);

      if (resProd.ok && resCat.ok && resMod.ok) {
        setProducts(await resProd.json());
        setCategories(await resCat.json());
        setModifiers(await resMod.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const toggleModifierSelection = (id: number) => {
    if (selectedModifierIds.includes(id)) {
      setSelectedModifierIds(selectedModifierIds.filter(mid => mid !== id));
    } else {
      setSelectedModifierIds([...selectedModifierIds, id]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        if (editingProduct?.id === id) {
          handleCancelEdit();
        }
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setImageUrl(product.imageUrl || '');
    setCategoryId(product.categoryId ? product.categoryId.toString() : '');
    setSelectedModifierIds(product.modifiers.map(m => m.id));
    setIsPromo(product.isPromo);
    setIsAdding(true);
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(0);
    setImageUrl('');
    setCategoryId('');
    setSelectedModifierIds([]);
    setIsPromo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        name,
        description: description || null,
        price,
        imageUrl: imageUrl || null,
        categoryId: categoryId ? Number(categoryId) : null,
        modifierIds: selectedModifierIds,
        isPromo
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        handleCancelEdit();
        fetchInitialData(); // Refresh list
      } else {
        alert('Error al guardar el producto');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando catálogo...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>Gestión de Catálogo</h1>
          <p className="text-muted">Administra tus platos, combos y precios</p>
        </div>
        <div className="flex" style={{ gap: '1rem' }}>
          {!isAdding && <button className="btn-primary" onClick={() => setIsAdding(true)}>+ Nuevo Producto</button>}
          <Link href="/admin" className="btn-outline">Volver al Panel</Link>
        </div>
      </header>

      {isAdding && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingProduct ? `Editar Producto: ${editingProduct.name}` : 'Agregar Producto / Combo'}
          </h2>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre del Producto</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Lomito Simple" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }} />
            </div>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Precio Base</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required min="0" placeholder="Ej: 5500" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Descripción / Ingredientes</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Carne de lomo, lechuga, tomate, mayonesa casera..." style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }} />
            </div>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', height: '38px' }}>
                <option value="">-- Seleccionar Categoría --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center" style={{ gap: '1rem', paddingTop: '1.5rem' }}>
              <label className="flex items-center text-bold" style={{ cursor: 'pointer', gap: '0.5rem' }}>
                <input type="checkbox" checked={isPromo} onChange={e => setIsPromo(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-red-primary)' }} />
                <span>¿Es una Promoción / Combo destacado?</span>
              </label>
            </div>

            {/* Product Image Fields */}
            <div style={{ gridColumn: '1 / -1', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', background: '#fafafa' }}>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Imagen del Producto</label>
              <div>
                <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>URL de la Imagen (Opcional)</label>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', display: 'block' }} />
                )}
                <input 
                  type="url" 
                  placeholder="https://ejemplo.com/hamburguesa.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                />
              </div>
            </div>
          </div>

          {/* Modifier selection checklist */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="text-bold" style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>Seleccionar Modificadores Aplicables</h3>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>Marca qué opciones pueden quitarse o agregarse a este producto al ser comprado</p>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {modifiers.map(mod => (
                <label key={mod.id} className="flex items-center" style={{ gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedModifierIds.includes(mod.id)}
                    onChange={() => toggleModifierSelection(mod.id)}
                    style={{ width: '1.1rem', height: '1.1rem', accentColor: mod.type === 'FREE' ? 'var(--color-red-primary)' : 'var(--color-green)' }}
                  />
                  <span>{mod.name} {mod.type === 'PAID' ? `(+$${mod.price})` : '(Gratis)'}</span>
                </label>
              ))}
              {modifiers.length === 0 && (
                <p className="text-muted" style={{ fontSize: '0.875rem', gridColumn: '1 / -1' }}>
                  No hay modificadores disponibles. <Link href="/admin/modifiers" className="text-red">Crea modificadores reutilizables aquí</Link>.
                </p>
              )}
            </div>
          </div>

          <div className="flex" style={{ gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Guardar Producto'}
            </button>
            <button type="button" className="btn-outline" onClick={handleCancelEdit}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Products list grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {products.map(product => (
          <div key={product.id} className="card flex flex-col" style={{ overflow: 'hidden', padding: 0 }}>
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', margin: 0 }} className="text-bold">{product.name}</h3>
                  {product.isPromo && <span className="status-badge bg-red-light text-red" style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', display: 'inline-block', marginTop: '0.25rem' }}>Promoción</span>}
                </div>
                <span className="text-bold text-red" style={{ fontSize: '1.125rem' }}>${product.price.toLocaleString()}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem', minHeight: '40px' }}>{product.description || 'Sin descripción'}</p>
              <div className="text-bold text-muted" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
                Categoría: {product.category?.name || 'General'}
              </div>
              
              <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', marginTop: 'auto' }}>
                <div className="text-bold" style={{ marginBottom: '0.25rem' }}>Modificadores ({product.modifiers.length}):</div>
                <ul style={{ paddingLeft: '1rem', margin: 0, listStyleType: 'circle' }}>
                  {product.modifiers.map(mod => (
                    <li key={mod.id} className={mod.type === 'FREE' ? 'text-red' : 'text-green'}>
                      {mod.name} {mod.type === 'PAID' ? `(+$${mod.price})` : '(Gratis)'}
                    </li>
                  ))}
                  {product.modifiers.length === 0 && <span style={{ color: '#aaa', fontSize: '0.75rem' }}>Ninguno</span>}
                </ul>
              </div>

              <div className="flex" style={{ gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => handleStartEdit(product)}>
                  Editar
                </button>
                <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => handleDelete(product.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && !isAdding && <div className="text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>No hay productos cargados en el catálogo.</div>}
      </div>
    </div>
  );
}
