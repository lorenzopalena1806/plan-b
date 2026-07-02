'use client';

import { useState, useEffect, useRef } from 'react';
import { Order, OrderItem } from '@prisma/client';
import { printTicket } from '@/lib/printUtils';

type OrderWithItems = Order & { items: OrderItem[] };

const generateChimeDataUrl = () => {
  if (typeof window === 'undefined') return '';
  try {
    const sampleRate = 11025;
    const duration = 1.0;
    const numSamples = sampleRate * duration;
    const buffer = new Uint8Array(44 + numSamples);

    // RIFF Header
    buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
    const fileSize = 36 + numSamples;
    buffer[4] = fileSize & 0xff;
    buffer[5] = (fileSize >> 8) & 0xff;
    buffer[6] = (fileSize >> 16) & 0xff;
    buffer[7] = (fileSize >> 24) & 0xff;
    buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

    // Format Chunk
    buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
    buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // Subchunk1Size = 16
    buffer[20] = 1; buffer[21] = 0; // AudioFormat = 1 (PCM)
    buffer[22] = 1; buffer[23] = 0; // NumChannels = 1 (Mono)
    
    // SampleRate = 11025
    buffer[24] = sampleRate & 0xff;
    buffer[25] = (sampleRate >> 8) & 0xff;
    buffer[26] = (sampleRate >> 16) & 0xff;
    buffer[27] = (sampleRate >> 24) & 0xff;
    
    // ByteRate = 11025
    buffer[28] = sampleRate & 0xff;
    buffer[29] = (sampleRate >> 8) & 0xff;
    buffer[30] = (sampleRate >> 16) & 0xff;
    buffer[31] = (sampleRate >> 24) & 0xff;
    
    buffer[32] = 1; buffer[33] = 0; // BlockAlign = 1
    buffer[34] = 8; buffer[35] = 0; // BitsPerSample = 8

    // Data Chunk
    buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
    buffer[40] = numSamples & 0xff;
    buffer[41] = (numSamples >> 8) & 0xff;
    buffer[42] = (numSamples >> 16) & 0xff;
    buffer[43] = (numSamples >> 24) & 0xff;

    // Generate three notes (C5, E5, G5) sequentially with linear decay
    const noteDuration = duration / 3;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let freq = 0;
      let noteVolume = 0.25; // Good volume level
      
      if (t < noteDuration) {
        freq = 523.25; // C5
        noteVolume *= (1 - t / noteDuration);
      } else if (t < noteDuration * 2) {
        freq = 659.25; // E5
        noteVolume *= (1 - (t - noteDuration) / noteDuration);
      } else {
        freq = 783.99; // G5
        noteVolume *= (1 - (t - noteDuration * 2) / noteDuration);
      }

      const angle = 2 * Math.PI * freq * t;
      const sample = Math.sin(angle);
      buffer[44 + i] = Math.round(128 + sample * noteVolume * 127);
    }

    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return `data:audio/wav;base64,${window.btoa(binary)}`;
  } catch (e) {
    console.error('Failed to generate chime WAV:', e);
    return '';
  }
};

export default function ComanderaPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hideAssigned, setHideAssigned] = useState(false);
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const chimeAudioUrlRef = useRef<string>('');

  const triggerChime = () => {
    if (typeof window === 'undefined') return;
    try {
      if (!chimeAudioUrlRef.current) {
        chimeAudioUrlRef.current = generateChimeDataUrl();
      }
      const url = chimeAudioUrlRef.current;
      if (!url) return;
      
      const audio = new Audio(url);
      audio.play().then(() => {
        setSoundEnabled(true);
      }).catch(err => {
        console.error('HTML5 Audio playback failed:', err);
      });
    } catch (e) {
      console.error('Web Audio API chime error:', e);
    }
  };

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
    fetch('/api/admin/drivers').then(res => res.json()).then(data => setDrivers(data.filter((d: any) => d.isActive))).catch(console.error);
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    
    // Auto-unlock AudioContext on first page interaction
    const unlock = () => {
      triggerChime();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    window.addEventListener('mousedown', unlock);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
    };
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const ids = orders.map(o => o.id);
      if (knownOrderIdsRef.current.size > 0) {
        const hasNewOrder = orders.some(o => o.status === 'PENDING' && !knownOrderIdsRef.current.has(o.id));
        if (hasNewOrder) {
          triggerChime();
        }
      }
      knownOrderIdsRef.current = new Set(ids);
    }
  }, [orders]);

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) {
        // Revert on failure
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      fetchOrders();
    }
  };

  const handleAssignDriver = async (order: OrderWithItems, driverIdStr: string) => {
    if (!driverIdStr) return;
    const driverId = parseInt(driverIdStr);
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    try {
      // Guardar asignación en BD
      await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      });

      // Abrir WhatsApp
      const text = `Nuevo viaje para llevar a ${order.address}. El cliente se llama ${order.customerName} y su teléfono es ${order.customerPhone || 'N/A'}. ${order.paymentMethod === 'TRANSFER' || order.paymentMethod === 'Transferencia' ? 'Ya está pagado por transferencia.' : `Tenés que cobrarle $${order.total.toLocaleString()} en efectivo.`}`;
      window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
      
      // Actualizar localmente si es necesario
      fetchOrders();
    } catch (error) {
      console.error('Error asignando repartidor:', error);
      alert('Error al asignar el repartidor. Por favor reintenta.');
    }
  };

  const handlePrintComanda = (order: OrderWithItems) => {
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
        <div class="comanda-item">
          <span class="comanda-qty">${item.quantity}x</span> ${item.productName}
          ${modifiers.length > 0 ? `<span class="comanda-notes">${modifiers.map((m:any) => m.name).join(', ')}</span>` : ''}
          ${rawNote ? `<span class="comanda-notes">${rawNote}</span>` : ''}
        </div>
      `;
    });

    const html = `
      <div class="text-center border-b mb-4">
        <h1 class="text-2xl font-bold mb-1">TICKET PREPARACIÓN</h1>
        <div class="text-xl font-bold">Orden #${order.id}</div>
        <div>${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        ${order.deliveryMethod === 'DELIVERY' 
          ? '<div class="text-lg font-bold mt-4" style="background:#000; color:#fff; padding:5px;">ENVÍO</div>' 
          : '<div class="text-lg font-bold mt-4" style="border: 2px solid #000; padding:5px;">RETIRO</div>'}
      </div>
      
      <div class="mb-4">
        ${itemsHtml}
      </div>
      
      ${order.customerNotes ? `<div class="border-t pt-2 mt-4 text-lg"><strong>NOTA DEL CLIENTE:</strong><br>${order.customerNotes}</div>` : ''}
    `;

    printTicket(html);
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

  const columns = [
    { id: 'PENDING', title: 'Pendiente' },
    { id: 'PREPARING', title: 'En Preparación' },
    { id: 'DELIVERY', title: 'Delivery (Listos)' },
    { id: 'PICKUP', title: 'Retiro Local (Listos)' }
  ];

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando comandera...</div>;

  return (
    <div style={{ padding: '1rem', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-red">Área de Preparación</h1>
        <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
          <span className="text-muted text-bold animate-pulse">● Live (30s)</span>
          <button 
            className="btn-outline" 
            onClick={triggerChime}
            style={{
              borderColor: soundEnabled ? 'var(--color-green)' : 'var(--color-red-primary)',
              color: soundEnabled ? 'var(--color-green)' : 'var(--color-red-primary)',
              backgroundColor: soundEnabled ? 'var(--color-green-light)' : 'var(--color-red-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '600'
            }}
          >
            {soundEnabled ? '🔊 Sonido Habilitado (Probar)' : '🔇 Habilitar Sonido'}
          </button>
          <button 
            className="btn-outline" 
            onClick={() => setHideAssigned(!hideAssigned)}
            style={{ fontWeight: '600', backgroundColor: hideAssigned ? 'var(--color-card)' : 'transparent' }}
          >
            {hideAssigned ? '🙈 Asignados Ocultos' : '👀 Ver Asignados'}
          </button>
          <button className="btn-outline" onClick={fetchOrders}>Refrescar</button>
        </div>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))', gap: '1rem', flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: '0.5rem' }}>
        {columns.map(col => {
          let columnOrders = orders.filter(o => {
            if (col.id === 'PENDING') return o.status === 'PENDING';
            if (col.id === 'PREPARING') return o.status === 'PREPARING';
            if (col.id === 'DELIVERY') return o.status === 'READY' && o.deliveryMethod === 'DELIVERY';
            if (col.id === 'PICKUP') return o.status === 'READY' && o.deliveryMethod === 'TAKEAWAY';
            return false;
          });

          // Si es delivery y se ocultan los asignados
          if (col.id === 'DELIVERY' && hideAssigned) {
            columnOrders = columnOrders.filter(o => !o.driverId);
          }

          return (
            <div key={col.id} style={{ background: '#f8f9fa', borderRadius: 'var(--border-radius-lg)', padding: '0.75rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>
                {col.title} ({columnOrders.length})
              </h2>
              
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
                {columnOrders.map(order => {
                  const isAssigned = order.driverId != null;
                  const assignedDriver = drivers.find(d => d.id === order.driverId);

                  return (
                    <div key={order.id} className="card flex-col" style={{ 
                      borderLeft: `4px solid ${order.deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-green)'}`,
                      padding: '0.75rem',
                      opacity: isAssigned ? 0.75 : 1,
                      backgroundColor: isAssigned ? '#e9ecef' : 'var(--color-card)',
                      gap: '0.5rem'
                    }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                        <span className="text-bold text-muted">#{order.id}</span>
                        <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                          <span className="status-badge bg-gray text-bold" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '0.7rem' }}>
                            {order.customerPhone ? '🌐 Web' : '🏪 Local'}
                          </span>
                          <span className={`status-badge ${order.deliveryMethod === 'DELIVERY' ? 'bg-red-light text-red' : 'status-ready'}`} style={{ fontSize: '0.7rem' }}>
                            {order.deliveryMethod}
                          </span>
                        </div>
                      </div>
                      
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{order.customerName}</h3>
                      
                      {isAssigned ? (
                        <div style={{ padding: '0.5rem', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                          🛵 Asignado a: {assignedDriver?.name || `Repartidor #${order.driverId}`}
                        </div>
                      ) : (
                        <>
                          {order.paymentMethod && (
                            <div style={{ 
                              padding: '0.4rem', 
                              background: order.paymentMethod === 'TRANSFER' ? 'var(--color-green-light)' : 'rgba(0,0,0,0.03)', 
                              border: `1px solid ${order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-border)'}`,
                              color: order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-text)', 
                              borderRadius: 'var(--border-radius-sm)', 
                              fontSize: '0.8rem' 
                            }}>
                              <strong>Pago:</strong> {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '📱 Transferencia'}
                              {order.paymentDetails && <div style={{ fontSize: '0.7rem', marginTop: '0.15rem' }}>{order.paymentDetails}</div>}
                            </div>
                          )}

                          {order.customerNotes && (
                            <div style={{ padding: '0.4rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem' }}>
                              <strong>Nota:</strong> {order.customerNotes}
                            </div>
                          )}
                          
                          <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
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
                                <div key={item.id} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                                  <div className="text-bold" style={{ fontSize: '0.9rem' }}>{item.quantity}x {item.productName}</div>
                                  {modifiers.length > 0 && (
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                      {modifiers.map((mod: any) => mod.name).join(', ')}
                                    </div>
                                  )}
                                  {rawNote && (
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                      {rawNote}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem' }}>
                            {order.couponCode && (
                              <div className="flex justify-between text-green" style={{ color: 'var(--color-green)' }}>
                                <span>Cupón: <strong>{order.couponCode}</strong></span>
                                <span>-${order.discountApplied.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-bold" style={{ fontSize: '0.95rem', borderTop: order.couponCode ? '1px dashed var(--color-border)' : 'none', paddingTop: order.couponCode ? '0.25rem' : '0' }}>
                              <span>Total:</span>
                              <span>${order.total.toLocaleString()}</span>
                            </div>
                          </div>

                          {col.id === 'DELIVERY' && (
                            <div className="flex flex-col" style={{ gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-card)' }}>
                              <label className="text-bold text-muted" style={{ fontSize: '0.75rem' }}>Asignar Repartidor:</label>
                              <select 
                                value={selectedDrivers[order.id] || ''}
                                onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [order.id]: e.target.value })}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                              >
                                <option value="">-- Seleccionar --</option>
                                {drivers.map(d => (
                                  <option key={d.id} value={d.id.toString()}>{d.name}</option>
                                ))}
                              </select>
                              {selectedDrivers[order.id] && (
                                <button 
                                  onClick={() => handleAssignDriver(order, selectedDrivers[order.id])}
                                  className="btn-outline"
                                  style={{ borderColor: '#25D366', color: '#25D366', textAlign: 'center', display: 'block', fontSize: '0.85rem', padding: '0.4rem' }}
                                >
                                  🛵 Avisar a Repartidor
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex justify-between mt-auto" style={{ gap: '0.4rem', paddingTop: '0.5rem' }}>
                        {col.id === 'PENDING' && <button className="btn-primary" style={{ background: '#004085', flex: 1, fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => updateOrderStatus(order.id, 'PREPARING')}>A Preparación</button>}
                        {col.id === 'PREPARING' && <button className="btn-primary" style={{ background: '#155724', flex: 1, fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => updateOrderStatus(order.id, 'READY')}>Marcar Listo</button>}
                        {col.id === 'PICKUP' && <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'COMPLETED')} style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}>Entregar al Cliente</button>}
                        {['PENDING', 'PREPARING'].includes(col.id) ? (
                          <button className="btn-outline" onClick={() => handlePrintComanda(order)} style={{ flex: 0, padding: '0.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Imprimir Ticket de Preparación">🧑‍🍳🖨️</button>
                        ) : (
                          <button className="btn-outline" onClick={() => handlePrintTicket(order)} style={{ flex: 0, padding: '0.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Imprimir Remito Cliente">🧾🖨️</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
