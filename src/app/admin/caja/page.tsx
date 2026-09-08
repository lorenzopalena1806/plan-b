'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order, OrderItem } from '@prisma/client';
import Link from 'next/link';
import { printTicket } from '@/lib/printUtils';

type OrderWithItems = Order & { items: OrderItem[] };

function parseModifiers(notes: string | null) {
  if (!notes) return { modifiers: [] as any[], rawNote: '' };
  try {
    const parsed = JSON.parse(notes);
    if (Array.isArray(parsed)) return { modifiers: parsed, rawNote: '' };
    if (parsed?.modifiers && Array.isArray(parsed.modifiers)) return { modifiers: parsed.modifiers, rawNote: '' };
    return { modifiers: [], rawNote: notes };
  } catch {
    return { modifiers: [], rawNote: notes };
  }
}

export default function CajaPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shift, setShift] = useState<any>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [initialBalance, setInitialBalance] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualBalance, setActualBalance] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?t=' + Date.now());
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchShift = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shifts');
      if (res.ok) {
        const data = await res.json();
        setShift(data.open ? data.shift : null);
        setShowOpenModal(!data.open);
      }
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchShift(), fetch('/api/config').then(r => r.json()).then(setConfig).catch(console.error)]);
    const interval = setInterval(() => { if (!document.hidden) fetchOrders(); }, 30000);
    const onVisible = () => { if (!document.hidden) fetchOrders(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchOrders, fetchShift]);

  const handleOpenShift = async () => {
    setIsOpening(true);
    try {
      const res = await fetch('/api/admin/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'OPEN', initialBalance: initialBalance || '0' }) });
      if (res.ok) { setInitialBalance(''); fetchShift(); }
      else alert('Error al abrir caja');
    } finally { setIsOpening(false); }
  };

  const handleCloseShift = async () => {
    if (!shift || !actualBalance) { alert('Ingresa el monto contado en caja.'); return; }
    setIsClosing(true);
    try {
      const res = await fetch('/api/admin/shifts/close', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shiftId: shift.id, actualBalance: parseFloat(actualBalance) }) });
      if (res.ok) { setShowCloseModal(false); setActualBalance(''); fetchShift(); }
      else alert('Error al cerrar caja');
    } finally { setIsClosing(false); }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseDescription) { alert('Completa el monto y el motivo.'); return; }
    const res = await fetch('/api/admin/shifts/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: expenseAmount, description: expenseDescription }) });
    if (res.ok) { setShowExpenseModal(false); setExpenseAmount(''); setExpenseDescription(''); fetchShift(); }
  };

  const confirmOrder = async (id: number) => {
    if (!confirm('¿El cliente ya pagó?')) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'PENDING' } : o));
    const res = await fetch('/api/orders/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PENDING' }) });
    if (!res.ok) fetchOrders();
  };

  const rejectOrder = async (id: number) => {
    const reason = prompt('¿Por que cancelas este pedido? (obligatorio)');
    if (!reason?.trim()) { alert('Debes ingresar un motivo.'); return; }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'REJECTED' } : o));
    const res = await fetch('/api/orders/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REJECTED', cancelReason: reason }) });
    if (!res.ok) fetchOrders();
  };

  const handlePrintTicket = (order: OrderWithItems) => {
    let itemsHtml = '';
    order.items.forEach(item => {
      const { modifiers, rawNote } = parseModifiers(item.notes);
      itemsHtml += '<tr><td class="w-qty">' + item.quantity + 'x</td><td>' + item.productName + (modifiers.length > 0 ? '<br><small class="comanda-notes">' + modifiers.map((m: any) => m.name).join(', ') + '</small>' : '') + (rawNote ? '<br><small class="comanda-notes">' + rawNote + '</small>' : '') + '</td></tr>';
    });
    printTicket('<div class="text-center mb-4"><h1 class="text-xl mb-1">TICKET DE PEDIDO</h1><div class="text-lg font-bold">Orden #' + (order.dailyNumber || order.id) + '</div><div>' + new Date(order.createdAt).toLocaleString('es-AR', { hour12: false, dateStyle: 'short', timeStyle: 'short' }) + '</div></div><div class="border-b mb-2"><div><strong>Cliente:</strong> ' + order.customerName + '</div>' + (order.address ? '<div><strong>Direccion:</strong> ' + order.address + '</div>' : '') + '<div><strong>Metodo:</strong> ' + (order.deliveryMethod === 'DELIVERY' ? 'Envio' : 'Retiro') + '</div>' + (order.customerNotes ? '<div class="mt-4"><strong>Nota:</strong> ' + order.customerNotes + '</div>' : '') + '</div><table class="w-full mb-2">' + itemsHtml + '</table><div class="border-t text-right"><strong>TOTAL: $' + order.total.toLocaleString() + '</strong></div><small>Gracias por su compra!</small>');
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando caja...</div>;

  const awaitingOrders = orders.filter(o => o.status === 'AWAITING_CONFIRMATION');
  const shiftCashSales = shift?.orders?.filter((o: any) => o.paymentMethod === 'CASH' && o.status === 'COMPLETED').reduce((s: number, o: any) => s + o.total, 0) ?? 0;
  const shiftTransferSales = shift?.orders?.filter((o: any) => (o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'Transferencia') && o.status === 'COMPLETED').reduce((s: number, o: any) => s + o.total, 0) ?? 0;
  const shiftTotalSales = shiftCashSales + shiftTransferSales;
  const shiftExpenses = shift?.expenses?.reduce((s: number, e: any) => s + e.amount, 0) ?? 0;
  const shiftExpectedBalance = (shift?.initialBalance ?? 0) + shiftCashSales - shiftExpenses;
  const shiftOrderCount = shift?.orders?.filter((o: any) => o.status === 'COMPLETED').length ?? 0;
  const closeActualNum = parseFloat(actualBalance) || 0;
  const closeDiff = closeActualNum - shiftExpectedBalance;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>

      {/* HEADER */}
      <header className="mobile-header-stack" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <div>
          <h1 className="text-red">Caja / Cobranza</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {shift ? 'Turno abierto desde ' + new Date(shift.openedAt || shift.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Sin turno activo'}
          </p>
        </div>
        <div className="flex" style={{ gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={fetchOrders} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>Refrescar</button>
          <Link href="/admin/caja/pos" className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', fontSize: '0.9rem' }}>
            Nueva Venta
          </Link>
          {shift && <>
            <button className="btn-outline" onClick={() => setShowExpenseModal(true)} style={{ color: 'var(--color-red-primary)', borderColor: 'var(--color-red-primary)', fontSize: '0.9rem' }}>- Egreso</button>
            <button className="btn-outline" onClick={() => setShowCloseModal(true)} style={{ fontSize: '0.9rem' }}>Cerrar Caja</button>
          </>}
          {!shift && <button className="btn-primary" onClick={() => setShowOpenModal(true)}>Abrir Caja</button>}
        </div>
      </header>

      {/* SHIFT SUMMARY */}
      {shift && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'SALDO INICIAL', value: '$' + (shift.initialBalance ?? 0).toLocaleString(), color: '#22c55e', sub: '' },
            { label: 'VENTAS EFECTIVO', value: '$' + shiftCashSales.toLocaleString(), color: '#16a34a', sub: '' },
            { label: 'TRANSFERENCIAS', value: '$' + shiftTransferSales.toLocaleString(), color: '#2563eb', sub: '' },
            { label: 'EGRESOS', value: '-$' + shiftExpenses.toLocaleString(), color: 'var(--color-red-primary)', sub: '' },
            { label: 'TOTAL VENDIDO', value: '$' + shiftTotalSales.toLocaleString(), color: '#7c3aed', sub: shiftOrderCount + ' pedidos' },
            { label: 'ESPERADO EN CAJA', value: '$' + shiftExpectedBalance.toLocaleString(), color: '#d97706', sub: 'Efectivo disponible' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid ' + card.color }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem', fontWeight: '600' }}>{card.label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: '700', color: card.color }}>{card.value}</p>
              {card.sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{card.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* EGRESOS LISTA */}
      {shift && shift.expenses && shift.expenses.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '700' }}>Egresos del turno</h3>
          {shift.expenses.map((e: any) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>{e.description}</span>
              <strong style={{ color: 'var(--color-red-primary)' }}>-${e.amount.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS */}
      <h2 style={{ marginBottom: '0.5rem' }}>Pedidos Por Confirmar ({awaitingOrders.length})</h2>
      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>Revisa WhatsApp para confirmar el pago y luego acepta el pedido.</p>

      <div className="grid grid-mobile-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {awaitingOrders.map(order => (
          <div key={order.id} className="card" style={{ borderLeft: '4px solid ' + (order.deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-green)') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: '700', color: 'var(--color-text-light)' }}>
                #{order.dailyNumber || order.id}  {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', background: '#f3f4f6', color: '#374151' }}>{order.customerPhone ? 'Web' : 'Local'}</span>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', background: order.deliveryMethod === 'DELIVERY' ? '#fee2e2' : '#dcfce7', color: order.deliveryMethod === 'DELIVERY' ? '#dc2626' : '#16a34a' }}>{order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Retiro'}</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{order.customerName}</h3>
            {order.address && <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>Direccion: {order.address}</p>}

            {order.customerNotes && (
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: '#fff3cd', color: '#856404', borderRadius: '6px', fontSize: '0.85rem' }}>
                <strong>Nota:</strong> {order.customerNotes}
              </div>
            )}

            {/* Metodo de pago badge */}
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', background: order.paymentMethod === 'CASH' ? '#f0fdf4' : '#eff6ff', color: order.paymentMethod === 'CASH' ? '#16a34a' : '#2563eb', border: '1px solid ' + (order.paymentMethod === 'CASH' ? '#86efac' : '#93c5fd') }}>
                {order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
              </span>
              <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-red-primary)' }}>
                ${order.total.toLocaleString()}
              </span>
            </div>

            {/* Items */}
            <div style={{ background: 'var(--color-bg)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
              {order.items.map(item => {
                const { modifiers, rawNote } = parseModifiers(item.notes);
                return (
                  <div key={item.id} style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: '700' }}>{item.quantity}x</span> {item.productName}
                    {modifiers.length > 0 && <div style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{modifiers.map((m: any) => m.name).join(', ')}</div>}
                    {rawNote && <div style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{rawNote}</div>}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" style={{ flex: 2 }} onClick={() => confirmOrder(order.id)}>Confirmar Pago</button>
                <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => rejectOrder(order.id)}>Rechazar</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-outline" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => handlePrintTicket(order)}>Imprimir Ticket</button>
                {order.customerPhone && (
                  <a
                    href={'https://wa.me/' + order.customerPhone.replace(/\D/g, '') + '?text=' + encodeURIComponent(
                      order.paymentMethod === 'TRANSFER' || order.paymentMethod === 'Transferencia'
                        ? 'Hola ' + order.customerName + ', recibimos tu pedido #' + (order.dailyNumber || order.id) + '.\n\nPara prepararlo realiza el pago de *$' + order.total.toLocaleString() + '* al alias: *' + (config?.bankAlias || 'N/A') + '*.\n\nEL PEDIDO NO SE PREPARARA HASTA QUE ENVIES EL COMPROBANTE.'
                        : 'Hola ' + order.customerName + ', recibimos tu pedido #' + (order.dailyNumber || order.id) + ' por *$' + order.total.toLocaleString() + '*. Ya lo estamos preparando!'
                    )}
                    target="_blank" rel="noreferrer"
                    className="btn-outline"
                    style={{ flex: 2, display: 'block', textAlign: 'center', borderColor: '#25D366', color: '#25D366', fontWeight: '700', fontSize: '0.85rem' }}
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {awaitingOrders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
            No hay pedidos pendientes de confirmacion.
          </div>
        )}
      </div>

      {/* MODAL ABRIR CAJA */}
      {showOpenModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>??</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem' }}>Apertura de Caja</h2>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>Ingresa el efectivo con el que arrancas el dia.</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem' }}>Efectivo inicial en caja ($)</label>
              <input
                type="number"
                value={initialBalance}
                onChange={e => setInitialBalance(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOpenShift()}
                placeholder="Ej: 5000  o deja en 0"
                autoFocus
                style={{ width: '100%', padding: '0.75rem', border: '2px solid var(--color-border)', borderRadius: '8px', fontSize: '1.5rem', textAlign: 'center' }}
              />
            </div>
            <button className="btn-primary" onClick={handleOpenShift} disabled={isOpening} style={{ width: '100%', padding: '1rem', fontWeight: '700', fontSize: '1.1rem' }}>
              {isOpening ? 'Abriendo...' : 'Abrir Caja y Comenzar el Dia'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CERRAR CAJA */}
      {showCloseModal && shift && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: '700', fontSize: '1.3rem', marginBottom: '1.5rem' }}>Cierre de Caja  Arqueo</h2>

            <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-light)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Resumen del Turno</p>
              {[
                { label: 'Saldo inicial', value: '$' + (shift.initialBalance ?? 0).toLocaleString(), color: '' },
                { label: '+ Ventas efectivo', value: '+$' + shiftCashSales.toLocaleString(), color: '#16a34a' },
                { label: '+ Ventas transferencia', value: '+$' + shiftTransferSales.toLocaleString(), color: '#2563eb' },
                shiftExpenses > 0 ? { label: '- Egresos', value: '-$' + shiftExpenses.toLocaleString(), color: 'var(--color-red-primary)' } : null,
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: row.color || 'inherit' }}>
                  <span>{row.label}</span><strong>{row.value}</strong>
                </div>
              ))}
              <hr style={{ margin: '0.75rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700' }}>
                <span>Efectivo esperado en caja</span>
                <span>${shiftExpectedBalance.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>
                <span>Total vendido (efectivo + transferencia)</span>
                <span>${shiftTotalSales.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem' }}>Efectivo real contado en caja ($)</label>
              <input
                type="number"
                value={actualBalance}
                onChange={e => setActualBalance(e.target.value)}
                placeholder="Conta los billetes y anota el total"
                autoFocus
                style={{ width: '100%', padding: '0.75rem', border: '2px solid var(--color-border)', borderRadius: '8px', fontSize: '1.5rem', textAlign: 'center' }}
              />
            </div>

            {actualBalance && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', background: closeDiff === 0 ? '#f0fdf4' : Math.abs(closeDiff) < 200 ? '#fffbeb' : '#fef2f2', border: '1px solid ' + (closeDiff === 0 ? '#86efac' : Math.abs(closeDiff) < 200 ? '#fcd34d' : '#fca5a5') }}>
                <p style={{ fontWeight: '700', fontSize: '1.1rem', color: closeDiff === 0 ? '#16a34a' : closeDiff > 0 ? '#2563eb' : '#dc2626' }}>
                  {closeDiff === 0 ? 'Caja cuadrada' : closeDiff > 0 ? 'Sobrante: +$' + closeDiff.toLocaleString() : 'Faltante: $' + closeDiff.toLocaleString()}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-outline" onClick={() => { setShowCloseModal(false); setActualBalance(''); }} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleCloseShift} disabled={isClosing} style={{ flex: 1, background: 'var(--color-red-primary)' }}>
                {isClosing ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EGRESO */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ fontWeight: '700', marginBottom: '1.5rem' }}>Cargar Egreso</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem' }}>Monto retirado ($)</label>
              <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="Ej: 1500" autoFocus style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1.1rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem' }}>Motivo</label>
              <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Ej: Pan, Hielo, Proveedor..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-outline" onClick={() => setShowExpenseModal(false)} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddExpense} style={{ flex: 1 }}>Guardar Egreso</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
