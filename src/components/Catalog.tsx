'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Category, ModifierOption } from '@prisma/client';
import { useCartStore } from '@/store/cartStore';
import Cart from './Cart';

type ProductWithRelations = Product & {
  category: Category | null;
  modifiers: (ModifierOption & { recipes?: any[] })[];
  images?: string[];
  comboItems?: any[];
};

export default function Catalog({
  products,
  categories = [],
  banners = [],
  whatsappNumber,
  isOpen,
  slug,
  cardLayout = 'grid',
  bankAlias = '',
  shippingFee = 0
}: {
  products: ProductWithRelations[];
  categories?: any[];
  banners?: any[];
  whatsappNumber: string;
  isOpen: boolean;
  slug: string;
  cardLayout?: string;
  bankAlias?: string;
  shippingFee?: number;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<(ModifierOption & { recipes?: any[] })[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentProductImageIndex, setCurrentProductImageIndex] = useState(0);
  const [cartVisible, setCartVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { addItem, getItems, getTotal } = useCartStore();
  const cartItems = getItems(slug);
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getTotal(slug);

  const hasPromos = products.some(p => p.isPromo);
  const promoTabName = 'Promos';

  // Use categories from API if provided, otherwise extract from products
  const categoriesList = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))) as string[];
    return [...(hasPromos ? [promoTabName] : []), ...fromProducts];
  }, [products, hasPromos]);

  useEffect(() => {
    if (categoriesList.length > 0 && !activeCategory) {
      setActiveCategory(categoriesList[0]);
    }
  }, [products]);

  // Auto-slide banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const openModal = useCallback((product: ProductWithRelations) => {
    setSelectedProduct(product);
    setSelectedModifiers([]);
    setCurrentProductImageIndex(0);
    setQuantity(1);
    setNoteText('');
  }, []);

  const closeModal = useCallback(() => setSelectedProduct(null), []);

  const addModifier = useCallback((mod: ModifierOption & { recipes?: any[] }) => {
    setSelectedModifiers(prev => [...prev, mod]);
  }, []);

  const removeModifier = useCallback((mod: ModifierOption & { recipes?: any[] }) => {
    setSelectedModifiers(prev => {
      const idx = prev.findIndex(m => m.id === mod.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct) return;
    addItem(slug, {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      quantity,
      modifiers: selectedModifiers,
      variants: [],
      categoryId: selectedProduct.categoryId || undefined,
      categoryName: selectedProduct.category?.name || undefined,
      notes: noteText.trim() || undefined,
    });
    closeModal();
  }, [selectedProduct, slug, quantity, selectedModifiers, noteText, addItem, closeModal]);

  // Quick add (no modal) for products without modifiers
  const handleQuickAdd = useCallback((e: React.MouseEvent, product: ProductWithRelations) => {
    e.stopPropagation();
    if (!isOpen) return;
    const hasMods = product.modifiers && product.modifiers.filter(m => m.isActive).length > 0;
    if (hasMods) {
      openModal(product);
      return;
    }
    addItem(slug, {
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity: 1,
      modifiers: [],
      variants: [],
      categoryId: product.categoryId || undefined,
      categoryName: product.category?.name || undefined,
    });
  }, [isOpen, openModal, addItem, slug]);

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    if (!matchesSearch) return false;
    if (searchTerm.trim() !== '') return true;
    if (activeCategory === promoTabName) return p.isPromo;
    return p.category?.name === activeCategory;
  }), [products, searchTerm, activeCategory]);

  const totalImages = selectedProduct
    ? (selectedProduct.imageUrl ? 1 : 0) + (selectedProduct.images?.length || 0)
    : 0;

  const modalPrice = selectedProduct
    ? (selectedProduct.price + selectedModifiers.reduce((s, m) => s + m.price, 0)) * quantity
    : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cat-pill {
          flex-shrink: 0;
          padding: 0.5rem 1.1rem;
          border-radius: 20px;
          border: 1.5px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
        }
        .cat-pill.active {
          background: var(--color-red-primary);
          color: white;
          border-color: var(--color-red-primary);
        }
        .product-card-new {
          background: var(--color-bg);
          border-radius: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border: 1px solid var(--color-border);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .product-card-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.13);
        }
        .product-card-new.disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .product-card-list {
          border-radius: 12px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.07);
          border: 1px solid var(--color-border);
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.15s ease;
          display: flex;
          gap: 0;
          background: var(--color-bg);
        }
        .product-card-list:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .quick-add-btn {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--color-red-primary);
          color: white;
          border: none;
          font-size: 1.3rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(225,29,72,0.4);
          transition: transform 0.15s ease, background 0.15s ease;
          z-index: 2;
        }
        .quick-add-btn:hover { transform: scale(1.12); background: #be123c; }
        .cart-float {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 90;
          width: calc(100% - 2rem);
          max-width: 420px;
        }
        .cart-float-btn {
          width: 100%;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(225, 29, 72, 0.45);
          transition: box-shadow 0.2s ease, transform 0.1s ease;
        }
        .cart-float-btn:hover { box-shadow: 0 8px 30px rgba(225, 29, 72, 0.55); }
        .cart-float-btn:active { transform: scale(0.98); }
        .cat-scrollbar::-webkit-scrollbar { display: none; }
        .cat-scrollbar { scrollbar-width: none; }
        @media (min-width: 900px) {
          .catalog-main-layout {
            display: grid !important;
            grid-template-columns: 1fr 380px !important;
            align-items: start;
            gap: 2rem;
          }
          .cart-float { display: none; }
        }
      `}} />

      <div className="catalog-main-layout" style={{ display: 'block' }}>
        <div>
          {/* Search Bar */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.45, fontSize: '1rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 2.5rem',
                borderRadius: '30px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '1rem' }}
              >✕</button>
            )}
          </div>

          {/* Banners */}
          {banners.length > 0 && (
            <div style={{ marginBottom: '1.25rem', borderRadius: '14px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '16/7', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              {banners.map((banner, index) => (
                <a
                  key={banner.id}
                  href={banner.link || '#'}
                  style={{ display: 'block', position: 'absolute', inset: 0, opacity: index === currentBannerIndex ? 1 : 0, transition: 'opacity 0.5s ease', zIndex: index === currentBannerIndex ? 1 : 0 }}
                >
                  <img src={banner.imageUrl} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </a>
              ))}
              {banners.length > 1 && (
                <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 10 }}>
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      style={{ width: idx === currentBannerIndex ? '20px' : '7px', height: '7px', borderRadius: '4px', background: idx === currentBannerIndex ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.3s ease' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Pills */}
          {searchTerm.trim() === '' && categoriesList.length > 0 && (
            <div className="cat-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '1.25rem' }}>
              {categoriesList.map(catName => (
                <button
                  key={catName}
                  className={`cat-pill ${activeCategory === catName ? 'active' : ''}`}
                  onClick={() => setActiveCategory(catName)}
                >
                  {catName === promoTabName ? `⭐ ${catName}` : catName}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: cardLayout === 'list' ? '1fr' : 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: cardLayout === 'list' ? '0.75rem' : '1rem',
            }}
          >
            {filteredProducts.map(product => {
              const hasMods = product.modifiers && product.modifiers.filter(m => m.isActive).length > 0;
              const originalPrice = product.comboItems && product.comboItems.length > 0
                ? product.comboItems.reduce((s: number, ci: any) => s + ((ci.product?.price || 0) * ci.quantity), 0)
                : null;

              if (cardLayout === 'list') {
                // List layout — horizontal card
                return (
                  <div
                    key={product.id}
                    className={`product-card-list${!isOpen ? ' disabled' : ''}`}
                    onClick={() => isOpen && openModal(product)}
                  >
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '110px', height: '100px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{product.name}</p>
                        {product.description && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <div>
                          {originalPrice && <p style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--color-text-light)' }}>${originalPrice.toLocaleString()}</p>}
                          <p style={{ fontWeight: 700, color: 'var(--color-red-primary)', fontSize: '1rem' }}>${product.price.toLocaleString()}</p>
                        </div>
                        {isOpen && (
                          <button className="quick-add-btn" style={{ position: 'static', flexShrink: 0 }} onClick={e => handleQuickAdd(e, product)}>+</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Grid layout — vertical card
              return (
                <div
                  key={product.id}
                  className={`product-card-new${!isOpen ? ' disabled' : ''}`}
                  onClick={() => isOpen && openModal(product)}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: '100%', height: '130px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '80px', background: 'var(--color-bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                      🍽️
                    </div>
                  )}
                  <div style={{ padding: '0.65rem 0.75rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem', lineHeight: '1.3' }}>{product.name}</p>
                    {product.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.35rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>
                        {product.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.25rem' }}>
                      <div>
                        {originalPrice && <p style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: 'var(--color-text-light)' }}>${originalPrice.toLocaleString()}</p>}
                        <p style={{ fontWeight: 700, color: 'var(--color-red-primary)', fontSize: '0.95rem' }}>${product.price.toLocaleString()}</p>
                      </div>
                      {isOpen && (
                        <button className="quick-add-btn" style={{ position: 'static', width: '30px', height: '30px', fontSize: '1.15rem' }} onClick={e => handleQuickAdd(e, product)}>+</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.5rem' }}>Desarrollado por</p>
            <img src="/logo.png" alt="Polosandia" style={{ height: '45px', opacity: 0.85 }} />
          </div>
        </div>

        {/* Sidebar Cart (desktop) */}
        <div style={{ paddingBottom: '100px' }}>
          <Cart whatsappNumber={whatsappNumber} isOpen={isOpen} slug={slug} bankAlias={bankAlias} shippingFee={shippingFee} categories={categories} />
        </div>
      </div>

      {/* Floating Cart Button (mobile) */}
      {cartItemsCount > 0 && (
        <div className="cart-float">
          <button
            className="cart-float-btn"
            onClick={() => document.getElementById('cart-sidebar')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{cartItemsCount}</span>
              Ver Carrito
            </span>
            <span>${cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
          onClick={closeModal}
        >
          <div
            style={{ background: 'var(--color-bg)', width: '100%', maxWidth: '540px', borderRadius: '20px 20px 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 0 0' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--color-border)' }} />
            </div>

            {/* Image */}
            {(selectedProduct.imageUrl || (selectedProduct.images && selectedProduct.images.length > 0)) && (
              <div style={{ position: 'relative', width: '100%', height: '220px', background: '#f5f5f5', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ display: 'flex', transition: 'transform 0.3s ease', transform: `translateX(-${currentProductImageIndex * 100}%)`, height: '100%' }}>
                  {selectedProduct.imageUrl && (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} style={{ width: '100%', flexShrink: 0, height: '100%', objectFit: 'cover' }} />
                  )}
                  {selectedProduct.images?.map((img, idx) => (
                    <img key={idx} src={img} alt={`${selectedProduct.name} ${idx + 1}`} style={{ width: '100%', flexShrink: 0, height: '100%', objectFit: 'cover' }} />
                  ))}
                </div>
                {totalImages > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setCurrentProductImageIndex(p => Math.max(0, p - 1)); }} style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: currentProductImageIndex > 0 ? 'block' : 'none' }}>❮</button>
                    <button onClick={e => { e.stopPropagation(); setCurrentProductImageIndex(p => Math.min(totalImages - 1, p + 1)); }} style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: currentProductImageIndex < totalImages - 1 ? 'block' : 'none' }}>❯</button>
                    <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      {Array.from({ length: totalImages }).map((_, idx) => (
                        <div key={idx} style={{ width: '7px', height: '7px', borderRadius: '50%', background: idx === currentProductImageIndex ? 'white' : 'rgba(255,255,255,0.5)' }} />
                      ))}
                    </div>
                  </>
                )}
                <button onClick={closeModal} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}

            {!selectedProduct.imageUrl && !(selectedProduct.images?.length) && (
              <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', zIndex: 10 }}>✕</button>
            )}

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem' }}>{selectedProduct.name}</h2>
              {selectedProduct.comboItems && selectedProduct.comboItems.length > 0 && (
                <p style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--color-text-light)', marginBottom: '0.15rem' }}>
                  Precio regular: ${selectedProduct.comboItems.reduce((s: number, ci: any) => s + ((ci.product?.price || 0) * ci.quantity), 0).toLocaleString()}
                </p>
              )}
              {selectedProduct.description && (
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>{selectedProduct.description}</p>
              )}

              {/* Free Modifiers */}
              {selectedProduct.modifiers.filter(m => m.type === 'FREE' && m.isActive).length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-red-primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Modificadores gratuitos</p>
                  {selectedProduct.modifiers.filter(m => m.type === 'FREE' && m.isActive).map(mod => {
                    const qty = selectedModifiers.filter(m => m.id === mod.id).length;
                    const isOutOfStock = mod.recipes && mod.recipes.length > 0
                      ? mod.recipes.some(r => r.ingredient && r.ingredient.currentStock < (r.quantityUsed * (qty + 1) * quantity))
                      : false;
                    return (
                      <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--color-bg-light)', borderRadius: '10px', marginBottom: '0.5rem', opacity: isOutOfStock && qty === 0 ? 0.5 : 1 }}>
                        <span style={{ fontSize: '0.875rem' }}>{mod.name}{mod.description ? ` (${mod.description})` : ''}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button onClick={() => removeModifier(mod)} disabled={qty === 0} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', cursor: qty === 0 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>-</button>
                          <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                          <button onClick={() => addModifier(mod)} disabled={isOutOfStock} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--color-red-primary)', color: 'white', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 700 }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paid Modifiers */}
              {selectedProduct.modifiers.filter(m => m.type === 'PAID' && m.isActive).length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-green)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Extras</p>
                  {selectedProduct.modifiers.filter(m => m.type === 'PAID' && m.isActive).map(mod => {
                    const qty = selectedModifiers.filter(m => m.id === mod.id).length;
                    const isOutOfStock = mod.recipes && mod.recipes.length > 0
                      ? mod.recipes.some(r => r.ingredient && r.ingredient.currentStock < (r.quantityUsed * (qty + 1) * quantity))
                      : false;
                    return (
                      <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--color-bg-light)', borderRadius: '10px', marginBottom: '0.5rem', opacity: isOutOfStock && qty === 0 ? 0.5 : 1 }}>
                        <div>
                          <span style={{ fontSize: '0.875rem' }}>{mod.name}{mod.description ? ` (${mod.description})` : ''}</span>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-green)', fontWeight: 700 }}>+${mod.price.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button onClick={() => removeModifier(mod)} disabled={qty === 0} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', cursor: qty === 0 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>-</button>
                          <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                          <button onClick={() => addModifier(mod)} disabled={isOutOfStock} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--color-green)', color: 'white', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 700 }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Note */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-text-light)' }}>Nota opcional</p>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Ej: Sin cebolla, bien cocido..."
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1.5px solid var(--color-border)', background: 'var(--color-bg-light)', color: 'var(--color-text)', fontSize: '0.85rem', resize: 'none', outline: 'none' }}
                />
              </div>
            </div>

            {/* Add to Cart Bar */}
            <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--color-bg-light)', borderRadius: '30px', padding: '0.3rem 0.65rem' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: quantity > 1 ? 'var(--color-red-primary)' : 'var(--color-border)', color: quantity > 1 ? 'white' : 'var(--color-text-light)', cursor: quantity > 1 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '1rem' }}>-</button>
                <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--color-red-primary)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>+</button>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddToCart}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '1.25rem', paddingRight: '1.25rem', boxShadow: '0 4px 12px rgba(225,29,72,0.35)' }}
              >
                <span>Agregar al carrito</span>
                <span>${modalPrice.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
