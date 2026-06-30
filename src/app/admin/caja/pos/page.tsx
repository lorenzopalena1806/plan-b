'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  isPromo: boolean;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  modifiers?: any[];
  allowBulkQuantities?: boolean;
}

interface CartItem {
  cartItemId: string;
  productId: number;
  name: string;
  basePrice: number;
  quantity: number;
  totalPrice: number;
  categoryId: number | null;
  modifiers?: any[];
  notes?: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string, discounts?: any[]}[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'PROMOS' | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [itemNote, setItemNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      
      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        
        // Solo activos
        const activeProducts = prodData.filter((p: Product) => p.isActive);
        setProducts(activeProducts);
        setCategories(catData);
        
        if (catData.length > 0) {
          setActiveCategory(catData[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedModifiers([]);
    setQuantity(1);
    setItemNote('');
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const toggleModifier = (mod: any) => {
    if (selectedModifiers.some(m => m.id === mod.id)) {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Check if exactly the same item (same product, modifiers, and note) exists
    const modifiersJson = JSON.stringify(selectedModifiers);
    const existingIndex = cart.findIndex(i => 
      i.productId === selectedProduct.id && 
      JSON.stringify(i.modifiers || []) === modifiersJson &&
      (i.notes || '') === itemNote.trim()
    );

    const priceToAdd = selectedProduct.price + selectedModifiers.reduce((sum, m) => sum + m.price, 0);

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      newCart[existingIndex].totalPrice = newCart[existingIndex].quantity * newCart[existingIndex].basePrice;
      setCart(newCart);
    } else {
      setCart([...cart, {
        cartItemId: Math.random().toString(36).substring(2, 9),
        productId: selectedProduct.id,
        name: selectedProduct.name,
        basePrice: priceToAdd,
        quantity: quantity,
        totalPrice: priceToAdd * quantity,
        categoryId: selectedProduct.categoryId,
        modifiers: selectedModifiers,
        notes: itemNote.trim()
      }]);
    }
    closeModal();
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          totalPrice: newQty * item.basePrice
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const rawTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate volume discounts
  let volumeDiscount = 0;
  const discountDetails: string[] = [];

  const itemsByCategory: Record<number, any[]> = {};
  cart.forEach(item => {
    if (item.categoryId) {
      if (!itemsByCategory[item.categoryId]) itemsByCategory[item.categoryId] = [];
      itemsByCategory[item.categoryId].push(item);
    }
  });

  Object.entries(itemsByCategory).forEach(([categoryIdStr, catItems]) => {
    const categoryId = parseInt(categoryIdStr);
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.discounts || category.discounts.length === 0) return;

    const totalQty = catItems.reduce((sum, item) => sum + item.quantity, 0);
    const applicableDiscounts = [...category.discounts].sort((a: any, b: any) => b.quantity - a.quantity);
    
    let flatItems: { basePrice: number, modifiersPrice: number }[] = [];
    catItems.forEach(item => {
      const modPrice = (item.modifiers || []).reduce((s: number, m: any) => s + m.price, 0);
      for (let i = 0; i < item.quantity; i++) {
        flatItems.push({ basePrice: item.basePrice - modPrice, modifiersPrice: modPrice }); // basePrice is already base+modifiers, wait.
      }
    });
    
    // In POSPage CartItem, basePrice IS the price of the item + modifiers.
    // Let's recalculate properly. The base item price without modifiers is item.basePrice - modPrice.
    flatItems = [];
    catItems.forEach(item => {
      const modPrice = (item.modifiers || []).reduce((s: number, m: any) => s + m.price, 0);
      const originalItemPrice = item.basePrice - modPrice;
      for (let i = 0; i < item.quantity; i++) {
        flatItems.push({ basePrice: originalItemPrice, modifiersPrice: modPrice });
      }
    });

    flatItems.sort((a, b) => b.basePrice - a.basePrice);

    let categorySavings = 0;
    for (const discount of applicableDiscounts) {
      while (flatItems.length >= discount.quantity) {
        let groupBaseTotal = 0;
        for (let i = 0; i < discount.quantity; i++) {
          const item = flatItems.pop()!;
          groupBaseTotal += item.basePrice;
        }
        const saving = groupBaseTotal - discount.price;
        if (saving > 0) {
          categorySavings += saving;
        }
      }
    }

    if (categorySavings > 0) {
      volumeDiscount += categorySavings;
      discountDetails.push(`Promo ${category.name}: -$${categorySavings.toLocaleString()}`);
    }
  });

  const total = rawTotal - volumeDiscount;

  const handleSubmit = async (status: 'PENDING' | 'COMPLETED') => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/orders/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Cliente Mostrador',
          deliveryMethod: 'TAKEAWAY',
          customerNotes: customerNotes.trim() || null,
          paymentMethod,
          status,
          total,
          items: cart
        })
      });

      if (res.ok) {
        setCart([]);
        setCustomerName('');
        alert(status === 'PENDING' ? 'Pedido enviado a cocina' : 'Pedido registrado y completado');
      } else {
        alert('Error al registrar pedido');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'PROMOS') return p.isPromo;
    return p.categoryId === activeCategory && !p.isPromo;
  });

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando POS...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: '100vh', overflow: 'hidden' }}>
      
      {/* Zona Izquierda: Categorías y Productos */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f4f5' }}>
        
        {/* Header simple */}
        <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="text-bold" style={{ fontSize: '1.25rem' }}>Punto de Venta</h1>
          <Link href="/admin/caja" className="btn-outline" style={{ padding: '0.5rem 1rem' }}>Volver a Caja</Link>
        </div>

        {/* Categorías (Tabs) */}
        <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', background: '#fff', borderBottom: '1px solid #e4e4e7' }}>
          {products.some(p => p.isPromo) && (
            <button
              onClick={() => setActiveCategory('PROMOS')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: activeCategory === 'PROMOS' ? 'var(--color-red-primary)' : '#f4f4f5',
                color: activeCategory === 'PROMOS' ? '#fff' : '#333'
              }}
            >
              ⭐ Promos
            </button>
          )}
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: activeCategory === cat.id ? 'var(--color-red-primary)' : '#f4f4f5',
                color: activeCategory === cat.id ? '#fff' : '#333'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid de Productos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => openModal(product)}
                style={{
                  background: '#fff',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  height: '140px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div className="text-bold" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{product.name}</div>
                <div style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>${product.price.toLocaleString()}</div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666' }}>
                No hay productos en esta categoría.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zona Derecha: Ticket (Carrito) */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '1px solid #e4e4e7', height: '100%' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
          <h2 className="text-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Ticket de Venta</h2>
          <input
            type="text"
            placeholder="Nombre del cliente (opcional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '0.5rem' }}
          />
          <textarea
            placeholder="Nota general del pedido (opcional)"
            value={customerNotes}
            onChange={e => setCustomerNotes(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'none', height: '60px' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>
              El ticket está vacío.<br/>Toca un producto para agregar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cart.map(item => (
                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f4f4f5', borderRadius: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="text-bold" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>${item.basePrice.toLocaleString()} c/u</div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                        + {item.modifiers.map(m => m.name).join(', ')}
                      </div>
                    )}
                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                        Nota: {item.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => updateQuantity(item.cartItemId, -1)} style={{ width: '24px', height: '24px', border: 'none', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, 1)} style={{ width: '24px', height: '24px', border: 'none', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                  <div style={{ width: '70px', textAlign: 'right', fontWeight: 'bold', paddingLeft: '0.5rem' }}>
                    ${item.totalPrice.toLocaleString()}
                  </div>
                  <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', color: 'red', marginLeft: '0.5rem', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '2px dashed #ccc', background: '#fafafa' }}>
          {discountDetails.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              {discountDetails.map((detail, idx) => (
                <div key={idx} style={{ color: 'var(--color-green)', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right' }}>
                  {detail}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>
            <span>Total:</span>
            <span className="text-bold">${total.toLocaleString()}</span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 className="text-bold" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Método de Pago</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPaymentMethod('CASH')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: paymentMethod === 'CASH' ? '2px solid var(--color-green)' : '1px solid #ccc',
                  background: paymentMethod === 'CASH' ? '#f0fdf4' : '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                💵 Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: paymentMethod === 'TRANSFER' ? '2px solid var(--color-green)' : '1px solid #ccc',
                  background: paymentMethod === 'TRANSFER' ? '#f0fdf4' : '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                📱 Transferencia
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, padding: '1rem', fontWeight: 'bold' }}
              onClick={() => handleSubmit('PENDING')}
              disabled={isSubmitting || cart.length === 0}
            >
              Enviar a Cocina
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE PRODUCTO */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 className="text-bold" style={{ fontSize: '1.25rem' }}>{selectedProduct.name}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            
            <p className="text-muted" style={{ marginBottom: '1rem' }}>${selectedProduct.price.toLocaleString()}</p>
            
            {selectedProduct.description && (
              <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>{selectedProduct.description}</p>
            )}

            {selectedProduct.modifiers && selectedProduct.modifiers.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-bold" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Opciones / Agregados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedProduct.modifiers.map(mod => (
                    <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedModifiers.some(m => m.id === mod.id)}
                        onChange={() => toggleModifier(mod)}
                      />
                      <span>{mod.name} (+${mod.price})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 className="text-bold" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Aclaraciones (Opcional)</h3>
              <textarea 
                placeholder="Ej: Sin sal, aderezo aparte..."
                value={itemNote}
                onChange={e => setItemNote(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'none', height: '60px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span className="text-bold">Cantidad:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '1.25rem' }}>-</button>
                <span className="text-bold" style={{ fontSize: '1.25rem' }}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '1.25rem' }}>+</button>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1rem', fontWeight: 'bold' }}
              onClick={handleAddToCart}
            >
              Agregar al Ticket - ${( (selectedProduct.price + selectedModifiers.reduce((sum, m) => sum + m.price, 0)) * quantity ).toLocaleString()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
