'use client';

import { useState, useEffect } from 'react';
import { Order, OrderItem } from '@prisma/client';
import Link from 'next/link';
import { printTicket } from '@/lib/printUtils';

type OrderWithItems = Order & { items: OrderItem[] };

export default function CajaPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetch('/api/config').then(res => res.json()).then(data => setConfig(data)).catch(console.error);
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const confirmOrder = async (id: number) => {
    if (!confirm('¿Has verificado el pago por WhatsApp y confirmas enviar este pedido a cocina?')) return;

    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'PENDING' } : o));
      
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING' })
      });
      
      if (!res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  };

  const rejectOrder = async (id: number) => {
    if (!confirm('¿Estás seguro de cancelar/rechazar este pedido?')) return;

    try {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'REJECTED' } : o));
      
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      });
      
      if (!res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  };

  const handlePrintTicket = (order: OrderWithItems) => {
    let itemsHtml = '';
    order.items.forEach(item => {
      let modifiers = [];
      let rawNote = '';
      if (item.notes) {
        try {
          const parsed = JSON.parse(item.notes);
          if (Array.isArray(parsed)) modifiers = parsed;
          else rawNote = item.notes;
        } catch (e) {
          rawNote = item.notes;
        }
      }
      itemsHtml += `
        <tr>
          <td class="w-qty">${item.quantity}x</td>
          <td>
            ${item.productName}
            ${modifiers.length > 0 ? `<br><small class="comanda-notes">${modifiers.map((m:any) => m.name).join(', ')}</small>` : ''}
            ${rawNote ? `<br><small class="comanda-notes">${rawNote}</small>` : ''}
          </td>
        </tr>
      `;
    });

    const html = `
      <div class="text-center mb-4">
        <h1 class="text-xl mb-1">TICKET DE PEDIDO</h1>
        <div class="text-lg font-bold">Orden #${order.id}</div>
        <div>${new Date(order.createdAt).toLocaleString()}</div>
      </div>
      
      <div class="border-b mb-2">
        <div><strong>Cliente:</strong> ${order.customerName}</div>
        ${order.address ? `<div><strong>Dirección:</strong> ${order.address}</div>` : ''}
        <div><strong>Método:</strong> ${order.deliveryMethod === 'DELIVERY' ? 'Envío' : 'Retiro por local'}</div>
        ${order.customerNotes ? `<div class="mt-4"><strong>Nota:</strong> ${order.customerNotes}</div>` : ''}
      </div>

      <table class="mb-4">
        <thead>
          <tr class="border-b">
            <th class="w-qty">Cant</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="border-t pt-2 mt-4 text-right">
        <div class="text-2xl font-bold">TOTAL: $${order.total.toLocaleString()}</div>
      </div>
      
      <div class="text-center mt-4 border-t pt-2">
        <small>¡Gracias por su compra!</small>
      </div>
    `;

    printTicket(html);
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando caja...</div>;

  const awaitingOrders = orders.filter(o => o.status === 'AWAITING_CONFIRMATION');

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h1 className="text-red">Caja / Cobranza</h1>
        <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
          <span className="text-muted text-bold animate-pulse">● Live (30s)</span>
          <button className="btn-outline" onClick={fetchOrders}>Refrescar</button>
          <Link href="/admin" className="btn-outline">Ir a Admin</Link>
          <Link href="/admin/comandera" className="btn-outline">Ir a Comandera</Link>
        </div>
      </header>

      <h2 style={{ marginBottom: '1.5rem' }}>Pedidos Por Confirmar ({awaitingOrders.length})</h2>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Los pedidos que aparecen aquí ya fueron realizados por los clientes. Revisa tu WhatsApp para confirmar el pago y luego acéptalos para enviarlos a cocina.</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {awaitingOrders.map(order => (
          <div key={order.id} className="card" style={{ borderLeft: `4px solid ${order.deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-green)'}` }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <span className="text-bold text-muted">#{order.id} - {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <span className={`status-badge ${order.deliveryMethod === 'DELIVERY' ? 'bg-red-light text-red' : 'status-ready'}`}>
                {order.deliveryMethod}
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{order.customerName}</h3>
            {order.address && <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>📍 {order.address}</p>}
            
            {order.customerNotes && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                <strong>Aclaración:</strong> {order.customerNotes}
              </div>
            )}
            
            <div style={{ marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)', maxHeight: '350px', overflowY: 'auto' }}>
              {order.items.map(item => {
                let modifiers = [];
                let rawNote = '';
                if (item.notes) {
                  try {
                    const parsed = JSON.parse(item.notes);
                    if (Array.isArray(parsed)) modifiers = parsed;
                    else rawNote = item.notes;
                  } catch (e) {
                    rawNote = item.notes;
                  }
                }

                return (
                  <div key={item.id} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <div className="text-bold">{item.quantity}x {item.productName}</div>
                    {modifiers.length > 0 && (
                      <div className="text-muted" style={{ paddingLeft: '1rem' }}>
                        {modifiers.map((mod: any) => mod.name).join(', ')}
                      </div>
                    )}
                    {rawNote && (
                      <div className="text-muted" style={{ paddingLeft: '1rem' }}>
                        {rawNote}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed var(--color-border)', textAlign: 'right', fontSize: '1.25rem' }} className="text-bold text-red">
                TOTAL: ${order.total.toLocaleString()}
              </div>
            </div>
            
            <div className="flex flex-col" style={{ gap: '0.75rem' }}>
              <div className="flex" style={{ gap: '0.5rem' }}>
                <button className="btn-primary" style={{ flex: 2 }} onClick={() => confirmOrder(order.id)}>✅ Confirmar Pago</button>
                <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }} onClick={() => rejectOrder(order.id)}>❌ Rechazar</button>
                <button className="btn-outline" style={{ flex: 0, padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Imprimir Ticket" onClick={() => handlePrintTicket(order)}>🖨️</button>
              </div>
              
              {order.customerPhone && (
                <a 
                  href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    order.paymentMethod === 'Transferencia' 
                    ? `Hola ${order.customerName}, recibimos tu pedido #${order.id}.\n\nPara enviarlo a cocina necesitamos que realices el pago de *$${order.total.toLocaleString()}* a nuestro alias: *${config?.bankAlias || 'N/A'}*.\n\n🚨 *IMPORTANTE: EL PEDIDO NO SE PREPARARÁ HASTA QUE ENVÍES EL COMPROBANTE POR ACÁ.* 🚨`
                    : `Hola ${order.customerName}, recibimos tu pedido #${order.id} por un total de *$${order.total.toLocaleString()}*. ¡Ya lo enviamos a cocina!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline"
                  style={{ width: '100%', display: 'block', textAlign: 'center', borderColor: '#25D366', color: '#25D366', fontWeight: 'bold' }}
                >
                  💬 Hablar por WhatsApp
                </a>
              )}
            </div>
          </div>
        ))}

        {awaitingOrders.length === 0 && (
          <div className="text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            No hay pedidos pendientes de confirmación.
          </div>
        )}
      </div>
    </div>
  );
}
