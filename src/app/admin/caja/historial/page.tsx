'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Shift = {
  id: number;
  status: string;
  openedAt: string;
  closedAt: string | null;
  initialBalance: number;
  expectedBalance: number;
  actualBalance: number | null;
  difference: number | null;
  orders: { id: number; total: number; paymentMethod: string }[];
  expenses: { id: number; amount: number; description: string }[];
};

export default function CajaHistorialPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/shifts/history')
      .then(r => r.json())
      .then(data => { setShifts(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const toggle = (id: number) => setExpanded(prev => prev === id ? null : id);

  const filtered = shifts.filter(s => {
    if (filter === 'cuadrada') return s.status === 'CLOSED' && Math.abs(s.difference ?? 0) < 200;
    if (filter === 'diferencia') return s.status === 'CLOSED' && Math.abs(s.difference ?? 0) >= 200;
    return true;
  });

  const closed = shifts.filter(s => s.status === 'CLOSED');
  const totalRev = closed.reduce((sum, s) => sum + s.orders.reduce((a, o) => a + o.total, 0), 0);
  const totalCash = closed.reduce((sum, s) => sum + s.orders.filter(o => o.paymentMethod === 'CASH').reduce((a, o) => a + o.total, 0), 0);
  const totalTr = closed.reduce((sum, s) => sum + s.orders.filter(o => o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'Transferencia').reduce((a, o) => a + o.total, 0), 0);
  const totalExp = closed.reduce((sum, s) => sum + s.expenses.reduce((a, e) => a + e.amount, 0), 0);

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando historial...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <div>
          <h1>Historial de Cajas</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>{closed.length} turnos cerrados</p>
        </div>
        <Link href="/admin/caja" className="btn-outline">Volver a Caja</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'TOTAL VENDIDO', value: '$' + totalRev.toLocaleString(), color: '#7c3aed' },
          { label: 'EFECTIVO', value: '$' + totalCash.toLocaleString(), color: '#16a34a' },
          { label: 'TRANSFERENCIAS', value: '$' + totalTr.toLocaleString(), color: '#2563eb' },
          { label: 'EGRESOS', value: '-$' + totalExp.toLocaleString(), color: '#dc2626' },
          { label: 'NETO', value: '$' + (totalRev - totalExp).toLocaleString(), color: '#d97706' },
          { label: 'TURNOS CERRADOS', value: closed.length.toString(), color: '#6b7280' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid ' + c.color }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>{c.label}</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'cuadrada', 'diferencia'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'btn-primary' : 'btn-outline'} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            {f === 'all' ? 'Todos' : f === 'cuadrada' ? 'Cuadradas' : 'Con diferencia'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>No hay turnos.</div>}
        {filtered.map(shift => {
          const cashS = shift.orders.filter(o => o.paymentMethod === 'CASH').reduce((s, o) => s + o.total, 0);
          const trS = shift.orders.filter(o => o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'Transferencia').reduce((s, o) => s + o.total, 0);
          const total = cashS + trS;
          const exp = shift.expenses.reduce((s, e) => s + e.amount, 0);
          const diff = shift.difference ?? 0;
          const isOpen = shift.status === 'OPEN';
          const isEx = expanded === shift.id;
          const bc = isOpen ? '#f59e0b' : Math.abs(diff) < 200 ? '#22c55e' : '#ef4444';

          return (
            <div key={shift.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', borderLeft: '4px solid ' + bc }}>
              <button onClick={() => toggle(shift.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1rem', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700' }}>Turno #{shift.id} - {new Date(shift.openedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                    <span style={{ padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: isOpen ? '#fef3c7' : '#f0fdf4', color: isOpen ? '#92400e' : '#16a34a' }}>{isOpen ? 'ABIERTO' : 'CERRADO'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Apertura: {new Date(shift.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    {shift.closedAt && <span>Cierre: {new Date(shift.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>}
                    <span>{shift.orders.length} pedidos</span>
                    {!isOpen && diff !== 0 && <span style={{ fontWeight: '700', color: diff > 0 ? '#16a34a' : '#dc2626' }}>{diff > 0 ? 'Sobrante' : 'Faltante'}: </span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#7c3aed' }}></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>total vendido</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: isEx ? 'var(--color-red-primary)' : 'var(--color-text-light)' }}>{isEx ? 'Cerrar' : 'Ver detalle'}</div>
                </div>
              </button>

              {isEx && (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Saldo inicial', value: '$' + shift.initialBalance.toLocaleString(), color: '' },
                      { label: 'Ventas efectivo', value: '$' + cashS.toLocaleString(), color: '#16a34a' },
                      { label: 'Transferencias', value: '$' + trS.toLocaleString(), color: '#2563eb' },
                      { label: 'Egresos', value: '-$' + exp.toLocaleString(), color: '#dc2626' },
                      { label: 'Esperado caja', value: '$' + shift.expectedBalance.toLocaleString(), color: '#d97706' },
                      shift.actualBalance !== null ? { label: 'Contado real', value: '$' + shift.actualBalance.toLocaleString(), color: '' } : null,
                    ].filter(Boolean).map((c: any) => (
                      <div key={c.label} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', fontWeight: '700', marginBottom: '0.15rem' }}>{c.label}</p>
                        <p style={{ fontWeight: '700', color: c.color || 'var(--color-text)' }}>{c.value}</p>
                      </div>
                    ))}
                  </div>

                  {shift.expenses.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Egresos del turno</p>
                      {shift.expenses.map(e => (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                          <span>{e.description}</span>
                          <strong style={{ color: '#dc2626' }}>-</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ padding: '0.75rem', borderRadius: '8px', textAlign: 'center', background: Math.abs(diff) < 200 ? '#f0fdf4' : '#fef2f2', border: '1px solid ' + (Math.abs(diff) < 200 ? '#86efac' : '#fca5a5') }}>
                    <span style={{ fontWeight: '700', color: Math.abs(diff) < 200 ? '#16a34a' : '#dc2626' }}>
                      {isOpen ? 'Turno activo' : diff === 0 ? 'Caja cuadrada' : diff > 0 ? 'Sobrante: +$' + diff.toLocaleString() : 'Faltante: $' + diff.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}