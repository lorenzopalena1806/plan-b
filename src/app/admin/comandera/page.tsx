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
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
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
          <span class="comanda-qty">\${item.quantity}x</span> \${item.productName}
          \${modifiers.length > 0 ? \`<span class="comanda-notes">\${modifiers.map((m:any) => m.name).join(', ')}</span>\` : ''}
          \${rawNote ? \`<span class="comanda-notes">\${rawNote}</span>\` : ''}
        </div>
      `;
    });

    const html = `
      <div class="text-center border-b mb-4">
        <h1 class="text-2xl font-bold mb-1">COMANDA</h1>
        <div class="text-xl font-bold">Orden #\${order.id}</div>
        <div>\${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        \${order.deliveryMethod === 'DELIVERY' 
          ? '<div class="text-lg font-bold mt-4" style="background:#000; color:#fff; padding:5px;">ENVÍO</div>' 
          : '<div class="text-lg font-bold mt-4" style="border: 2px solid #000; padding:5px;">RETIRO</div>'}
      </div>
      
      <div class="mb-4">
        \${itemsHtml}
      </div>
      
      \${order.customerNotes ? \`<div class="border-t pt-2 mt-4 text-lg"><strong>NOTA DEL CLIENTE:</strong><br>\${order.customerNotes}</div>\` : ''}
    `;

    printTicket(html);
  };

  const columns = [
    { id: 'PENDING', title: 'Pendiente' },
    { id: 'PREPARING', title: 'En Preparación' },
    { id: 'READY', title: 'Listo para entregar' }
  ];

  if (isLoading) return <div className="container" style={{ padding: '2rem' }}>Cargando comandera...</div>;

  return (
    <div style={{ padding: '1rem', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-red">Comandera</h1>
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
          <button className="btn-outline" onClick={fetchOrders}>Refrescar</button>
        </div>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        {columns.map(col => (
          <div key={col.id} style={{ background: '#f8f9fa', borderRadius: 'var(--border-radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>{col.title} ({orders.filter(o => o.status === col.id).length})</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {orders.filter(o => o.status === col.id).map(order => (
                <div key={order.id} className="card" style={{ borderLeft: `4px solid ${order.deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-green)'}` }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <span className="text-bold text-muted">#{order.id}</span>
                    <span className={`status-badge ${order.deliveryMethod === 'DELIVERY' ? 'bg-red-light text-red' : 'status-ready'}`}>
                      {order.deliveryMethod}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{order.customerName}</h3>
                  
                  {order.paymentMethod && (
                    <div style={{ 
                      marginBottom: '0.5rem', 
                      padding: '0.5rem', 
                      background: order.paymentMethod === 'TRANSFER' ? 'var(--color-green-light)' : 'rgba(0,0,0,0.03)', 
                      border: `1px solid ${order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-border)'}`,
                      color: order.paymentMethod === 'TRANSFER' ? 'var(--color-green)' : 'var(--color-text)', 
                      borderRadius: 'var(--border-radius-sm)', 
                      fontSize: '0.875rem' 
                    }}>
                      <strong>Pago:</strong> {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '📱 Transferencia'}
                      {order.paymentDetails && <div style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>{order.paymentDetails}</div>}
                    </div>
                  )}

                  {order.customerNotes && (
                    <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                      <strong>Nota:</strong> {order.customerNotes}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
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
                        <div key={item.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--color-border)' }}>
                          <div className="text-bold">{item.quantity}x {item.productName}</div>
                          {modifiers.length > 0 && (
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                              {modifiers.map((mod: any) => mod.name).join(', ')}
                            </div>
                          )}
                          {rawNote && (
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                              {rawNote}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Coupon and Total Summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                    {order.couponCode && (
                      <div className="flex justify-between text-green" style={{ color: 'var(--color-green)' }}>
                        <span>Cupón: <strong>{order.couponCode}</strong></span>
                        <span>-${order.discountApplied.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-bold" style={{ fontSize: '1rem', borderTop: order.couponCode ? '1px dashed var(--color-border)' : 'none', paddingTop: order.couponCode ? '0.25rem' : '0' }}>
                      <span>Total:</span>
                      <span>${order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-auto" style={{ gap: '0.5rem' }}>
                    {col.id === 'PENDING' && <button className="btn-primary" style={{ background: '#004085', flex: 1 }} onClick={() => updateOrderStatus(order.id, 'PREPARING')}>A Preparación</button>}
                    {col.id === 'PREPARING' && <button className="btn-primary" style={{ background: '#155724', flex: 1 }} onClick={() => updateOrderStatus(order.id, 'READY')}>Marcar Listo</button>}
                    {col.id === 'READY' && <button className="btn-primary" onClick={() => updateOrderStatus(order.id, 'COMPLETED')} style={{ flex: 1 }}>Entregar</button>}
                    <button className="btn-outline" onClick={() => handlePrintComanda(order)} style={{ flex: 0, padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Imprimir Comanda">🖨️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
