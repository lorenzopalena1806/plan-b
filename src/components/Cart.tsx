'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function Cart({ whatsappNumber, isOpen, slug }: { whatsappNumber: string, isOpen: boolean, slug: string }) {
  const { deliveryMethod, customerName, address, customerNotes, setDeliveryMethod, setCustomerName, setAddress, setCustomerNotes, removeItem, clearCart, getItems, getTotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = getItems(slug);
  const total = getTotal(slug);

  const handleCheckout = async () => {
    if (!isOpen) {
      alert("El local se encuentra cerrado.");
      return;
    }
    
    if (!customerName.trim()) {
      alert("Por favor ingresa tu nombre.");
      return;
    }

    if (deliveryMethod === 'DELIVERY' && !address.trim()) {
      alert("Por favor ingresa tu dirección para el delivery.");
      return;
    }

    if (items.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Guardar orden en DB
      const response = await fetch(`/api/public/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          deliveryMethod,
          address: deliveryMethod === 'DELIVERY' ? address : null,
          items,
          total,
          customerNotes: customerNotes.trim() || null
        })
      });

      if (!response.ok) throw new Error("Error al procesar el pedido.");
      
      const order = await response.json();

      // 2. Construir mensaje de WhatsApp
      let msg = `*NUEVO PEDIDO #${order.id}*\n`;
      msg += `*Cliente:* ${customerName}\n`;
      msg += `*Entrega:* ${deliveryMethod === 'TAKEAWAY' ? 'Retiro en local' : 'Delivery'}\n`;
      if (deliveryMethod === 'DELIVERY') msg += `*Dirección:* ${address}\n`;
      
      msg += `\n*Detalle:*\n`;
      items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} ($${item.totalPrice.toLocaleString()})\n`;
        item.modifiers.forEach(mod => {
          msg += `  > ${mod.type === 'FREE' ? 'SIN' : 'EXTRA'} ${mod.name}\n`;
        });
      });

      if (customerNotes.trim()) {
        msg += `\n*Notas/Aclaraciones:* ${customerNotes.trim()}\n`;
      }
      
      msg += `\n*TOTAL A PAGAR: $${total.toLocaleString()}*`;

      // 3. Limpiar carrito y redirigir
      clearCart(slug);
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      
    } catch (error) {
      alert("Hubo un problema procesando tu pedido.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="card" style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>Tu Pedido</h2>
      
      <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '1.5rem' }}>
        {items.map(item => (
          <div key={item.cartItemId} className="flex justify-between" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span className="text-bold">{item.quantity}x </span>
              <span>{item.name}</span>
              {item.modifiers.map(mod => (
                <div key={mod.id} className={mod.type === 'FREE' ? 'text-red' : 'text-green'} style={{ paddingLeft: '1.5rem', fontSize: '0.75rem' }}>
                  {mod.type === 'FREE' ? 'Sin ' : 'Extra '}{mod.name}
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-bold">${item.totalPrice.toLocaleString()}</span>
              <button onClick={() => removeItem(slug, item.cartItemId)} className="text-red text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '2px solid var(--color-red-light)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
        <div className="flex justify-between text-bold" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <span>Total:</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Tu Nombre" 
          value={customerName} 
          onChange={e => setCustomerName(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', outlineColor: 'var(--color-red-primary)' }}
        />
        
        <div className="flex" style={{ gap: '0.5rem' }}>
          <button 
            className={`btn-outline ${deliveryMethod === 'TAKEAWAY' ? 'bg-red-light text-red' : ''}`} 
            style={{ flex: 1, borderColor: deliveryMethod === 'TAKEAWAY' ? 'var(--color-red-primary)' : 'var(--color-border)' }}
            onClick={() => setDeliveryMethod('TAKEAWAY')}
          >
            Retiro
          </button>
          <button 
            className={`btn-outline ${deliveryMethod === 'DELIVERY' ? 'bg-red-light text-red' : ''}`} 
            style={{ flex: 1, borderColor: deliveryMethod === 'DELIVERY' ? 'var(--color-red-primary)' : 'var(--color-border)' }}
            onClick={() => setDeliveryMethod('DELIVERY')}
          >
            Delivery
          </button>
        </div>

        {deliveryMethod === 'DELIVERY' && (
          <input 
            type="text" 
            placeholder="Dirección de envío" 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', outlineColor: 'var(--color-red-primary)' }}
          />
        )}

        <textarea 
          placeholder="Notas/Aclaraciones adicionales (ej: sin mayonesa, tocar timbre fuerte, etc.)" 
          value={customerNotes} 
          onChange={e => setCustomerNotes(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', outlineColor: 'var(--color-red-primary)', fontFamily: 'inherit', resize: 'none' }}
        />
      </div>

      <button className="btn-primary" onClick={handleCheckout} disabled={!isOpen || isSubmitting}>
        {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
      </button>
    </div>
  );
}
