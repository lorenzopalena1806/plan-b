'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        if (res.status === 403) {
          setError('Acceso Denegado: No tienes permisos para ver esta sección.');
        } else {
          setError('Error al obtener cupones.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          discountType,
          discountValue: parseFloat(discountValue),
          minPurchase: parseFloat(minPurchase) || 0
        })
      });

      if (res.ok) {
        setCode('');
        setDiscountValue('');
        setMinPurchase('');
        setDiscountType('PERCENTAGE');
        fetchCoupons();
      } else {
        const result = await res.json();
        setError(result.error || 'Error al crear el cupón.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const updatedStatus = !coupon.isActive;
      // Optimistic update
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, isActive: updatedStatus } : c));

      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus })
      });

      if (!res.ok) {
        // Revert on failure
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
      fetchCoupons();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cupón?')) return;

    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons(coupons.filter(c => c.id !== id));
      } else {
        const result = await res.json();
        alert(result.error || 'Error al eliminar cupón.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>Gestión de Cupones</h1>
          <p className="text-muted">Crea cupones de descuento para tus clientes</p>
        </div>
        <Link href="/admin" className="btn-outline">Volver</Link>
      </header>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Create Coupon Card */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Nuevo Cupón</h3>
          <form onSubmit={handleCreate} className="grid" style={{ gap: '1rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Código del Cupón</label>
              <input
                type="text"
                placeholder="Ej: DESCUENTO10"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '4px', textTransform: 'uppercase' }}
                required
              />
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Tipo de Descuento</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '4px', height: '38px' }}
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Monto Fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Valor del Descuento</label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder={discountType === 'PERCENTAGE' ? "Ej: 10 (para 10%)" : "Ej: 500 (para $500)"}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
            </div>

            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>Compra Mínima ($)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Ej: 1500 (opcional)"
                value={minPurchase}
                onChange={e => setMinPurchase(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Cupón'}
            </button>
          </form>
        </div>

        {/* Coupon List Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                <th style={{ padding: '0.75rem 1rem' }}>Descuento</th>
                <th style={{ padding: '0.75rem 1rem' }}>Compra Mínima</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Activo</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                    No tienes cupones creados aún.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: coupon.isActive ? 1 : 0.6 }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }} className="font-mono text-red">
                      {coupon.code}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {coupon.discountType === 'PERCENTAGE' 
                        ? `${coupon.discountValue}% OFF` 
                        : `$${coupon.discountValue.toLocaleString()} OFF`}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {coupon.minPurchase > 0 
                        ? `$${coupon.minPurchase.toLocaleString()}` 
                        : 'Sin mínimo'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={coupon.isActive}
                        onChange={() => handleToggleActive(coupon)}
                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--color-red-primary)' }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="text-red"
                        style={{ fontWeight: 'bold', fontSize: '0.875rem', textDecoration: 'underline' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
