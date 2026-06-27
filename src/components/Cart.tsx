'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function Cart({ whatsappNumber, isOpen, slug, bankAlias = '', shippingFee = 0 }: { whatsappNumber: string, isOpen: boolean, slug: string, bankAlias?: string, shippingFee?: number }) {
  const { deliveryMethod, customerName, address, customerNotes, setDeliveryMethod, setCustomerName, setAddress, setCustomerNotes, removeItem, clearCart, getItems, getTotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [cashAmount, setCashAmount] = useState('');

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const items = getItems(slug);
  const subtotal = getTotal(slug);

  // Auto-remove coupon if subtotal drops below minimum purchase requirement
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minPurchase) {
      setAppliedCoupon(null);
      setCouponError(`Cupón removido: el monto mínimo es de $${appliedCoupon.minPurchase.toLocaleString()}`);
    }
  }, [subtotal, appliedCoupon]);

  // Calculate discount
  let discountApplied = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountApplied = subtotal * (appliedCoupon.discountValue / 100);
    } else {
      discountApplied = appliedCoupon.discountValue;
    }
    // Limit discount to not exceed subtotal
    if (discountApplied > subtotal) {
      discountApplied = subtotal;
    }
  }

  const finalTotal = subtotal + (deliveryMethod === 'DELIVERY' ? shippingFee : 0) - discountApplied;

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setCouponError('');
    setIsValidatingCoupon(true);
    try {
      const code = couponCodeInput.toUpperCase().trim();
      const res = await fetch(`/api/public/${slug}/coupons/${code}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Cupón inválido');
      }
      const coupon = await res.json();
      
      if (subtotal < coupon.minPurchase) {
        throw new Error(`El pedido mínimo para este cupón es de $${coupon.minPurchase.toLocaleString()}`);
      }
      
      setAppliedCoupon(coupon);
      setCouponError('');
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Error al validar cupón');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

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
      let paymentDetails = '';
      if (paymentMethod === 'CASH') {
        if (cashAmount.trim()) {
          const cashVal = parseFloat(cashAmount);
          if (!isNaN(cashVal)) {
            paymentDetails = `Paga con $${cashVal.toLocaleString()}${cashVal > finalTotal ? `. Vuelto: $${(cashVal - finalTotal).toLocaleString()}` : ''}`;
          } else {
            paymentDetails = 'Monto exacto';
          }
        } else {
          paymentDetails = 'Monto exacto';
        }
      } else {
        paymentDetails = `Alias: ${bankAlias}`;
      }

      // 1. Guardar orden en DB
      const response = await fetch(`/api/public/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          deliveryMethod,
          address: deliveryMethod === 'DELIVERY' ? address : null,
          items,
          total: finalTotal,
          customerNotes: customerNotes.trim() || null,
          paymentMethod,
          paymentDetails,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          discountApplied
        })
      });

      if (!response.ok) throw new Error("Error al procesar el pedido.");
      
      const order = await response.json();

      // 2. Construir mensaje de WhatsApp
      let msg = `*NUEVO PEDIDO #${order.id}*\n`;
      msg += `*Cliente:* ${customerName}\n`;
      msg += `*Entrega:* ${deliveryMethod === 'TAKEAWAY' ? 'Retiro en local' : 'Delivery'}\n`;
      if (deliveryMethod === 'DELIVERY') {
        msg += `*Dirección:* ${address}\n`;
        if (shippingFee > 0) msg += `*Envío:* $${shippingFee.toLocaleString()}\n`;
      }
      
      msg += `*Pago:* ${paymentMethod === 'CASH' ? '💵 Efectivo' : '📱 Transferencia'}\n`;
      if (paymentDetails) msg += `  > ${paymentDetails}\n`;
      
      msg += `\n*Detalle:*\n`;
      items.forEach(item => {
        msg += `- ${item.quantity}x ${item.name} ($${item.totalPrice.toLocaleString()})\n`;
        item.modifiers.forEach(mod => {
          msg += `  > ${mod.type === 'FREE' ? 'SIN' : 'EXTRA'} ${mod.name}\n`;
        });
      });

      if (appliedCoupon) {
        msg += `\n*Cupón Aplicado:* ${appliedCoupon.code} (-$${discountApplied.toLocaleString()})\n`;
      }

      if (customerNotes.trim()) {
        msg += `\n*Notas/Aclaraciones:* ${customerNotes.trim()}\n`;
      }
      
      msg += `\n*TOTAL A PAGAR: $${finalTotal.toLocaleString()}*`;

      // 3. Limpiar carrito y redirigir
      clearCart(slug);
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
      window.location.href = url;
      
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

      {/* Sección de Cupón de Descuento */}
      <div style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
        <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Cupón de Descuento</label>
        {appliedCoupon ? (
          <div className="flex justify-between items-center" style={{ background: 'var(--color-green-light)', border: '1px dashed var(--color-green)', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.875rem' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--color-green)' }}>{appliedCoupon.code}</span>
              <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                {appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% OFF` : `-$${appliedCoupon.discountValue.toLocaleString()}`}
              </span>
            </div>
            <button 
              onClick={handleRemoveCoupon} 
              className="text-red" 
              style={{ fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              Remover
            </button>
          </div>
        ) : (
          <div className="flex" style={{ gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Código de cupón" 
              value={couponCodeInput} 
              onChange={e => setCouponCodeInput(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', textTransform: 'uppercase', outlineColor: 'var(--color-red-primary)', fontSize: '0.875rem' }}
            />
            <button 
              onClick={handleApplyCoupon}
              disabled={isValidatingCoupon || !couponCodeInput.trim()}
              className="btn-outline" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 'bold' }}
            >
              {isValidatingCoupon ? '...' : 'Aplicar'}
            </button>
          </div>
        )}
        {couponError && (
          <p style={{ color: 'var(--color-red-primary)', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 'bold' }}>{couponError}</p>
        )}
      </div>

      <div style={{ paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
        {deliveryMethod === 'DELIVERY' && shippingFee > 0 && (
          <>
            <div className="flex justify-between text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span>Envío a Domicilio:</span>
              <span>+${shippingFee.toLocaleString()}</span>
            </div>
          </>
        )}
        {discountApplied > 0 && (
          <div className="flex justify-between text-bold" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-green)' }}>
            <span>Descuento ({appliedCoupon?.code}):</span>
            <span>-${discountApplied.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-bold" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <span>Total:</span>
          <span>${finalTotal.toLocaleString()}</span>
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

        {/* Payment Methods Selection */}
        {bankAlias ? (
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Método de Pago</label>
            <div className="flex" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
              <button 
                type="button"
                className={`btn-outline ${paymentMethod === 'CASH' ? 'bg-red-light text-red' : ''}`} 
                style={{ flex: 1, borderColor: paymentMethod === 'CASH' ? 'var(--color-red-primary)' : 'var(--color-border)', fontSize: '0.875rem', padding: '0.5rem' }}
                onClick={() => setPaymentMethod('CASH')}
              >
                💵 Efectivo
              </button>
              <button 
                type="button"
                className={`btn-outline ${paymentMethod === 'TRANSFER' ? 'bg-red-light text-red' : ''}`} 
                style={{ flex: 1, borderColor: paymentMethod === 'TRANSFER' ? 'var(--color-red-primary)' : 'var(--color-border)', fontSize: '0.875rem', padding: '0.5rem' }}
                onClick={() => setPaymentMethod('TRANSFER')}
              >
                📱 Transferencia
              </button>
            </div>
          </div>
        ) : null}

        {/* Specific payment details inputs */}
        {paymentMethod === 'CASH' && bankAlias && (
          <input 
            type="number" 
            placeholder="¿Con cuánto vas a pagar? (opcional)" 
            value={cashAmount} 
            onChange={e => setCashAmount(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', outlineColor: 'var(--color-red-primary)' }}
          />
        )}

        {paymentMethod === 'TRANSFER' && bankAlias && (
          <div style={{ padding: '0.75rem', background: 'var(--color-green-light)', border: '1px solid var(--color-green)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
            <p style={{ fontWeight: 'bold', color: 'var(--color-green)' }}>Datos para la transferencia:</p>
            <p style={{ marginTop: '0.25rem' }}>Alias: <strong style={{ textDecoration: 'underline' }}>{bankAlias}</strong></p>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Realiza la transferencia y envía el comprobante por WhatsApp al confirmar.</p>
          </div>
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
