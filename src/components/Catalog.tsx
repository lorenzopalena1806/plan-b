'use client';

import { useState, useEffect } from 'react';
import { Product, Category, ModifierOption } from '@prisma/client';
import { useCartStore } from '@/store/cartStore';
import Cart from './Cart';

type ProductWithRelations = Product & {
  category: Category | null;
  modifiers: (ModifierOption & { recipes?: any[] })[];
  images?: string[];
  comboItems?: any[];
};

export default function Catalog({ products, categories = [], banners = [], whatsappNumber, isOpen, slug, cardLayout = 'grid', bankAlias = '', shippingFee = 0 }: { products: ProductWithRelations[], categories?: any[], banners?: any[], whatsappNumber: string, isOpen: boolean, slug: string, cardLayout?: string, bankAlias?: string, shippingFee?: number }) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<(ModifierOption & {recipes?: any[]})[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentProductImageIndex, setCurrentProductImageIndex] = useState(0);

  const { addItem, getItems, getTotal } = useCartStore();
  const cartItemsCount = getItems(slug).reduce((sum, item) => sum + item.quantity, 0);
  // Extract unique categories from products (excluding promos from regular category list)
  const regularCategories = Array.from(
    new Set(products.map(p => p.category?.name).filter(Boolean))
  ) as string[];

  // Determine if there are promos
  const hasPromos = products.some(p => p.isPromo);
  const promoTabName = 'Promos';

  // Combine into a list of tabs
  const categoriesList = [...(hasPromos ? [promoTabName] : []), ...regularCategories];

  // Set default active category once categories are loaded
  useEffect(() => {
    if (categoriesList.length > 0 && !activeCategory) {
      setActiveCategory(categoriesList[0]);
    }
  }, [products]);

  // Auto-slide banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const openModal = (product: ProductWithRelations) => {
    setSelectedProduct(product);
    setSelectedModifiers([]);
    setCurrentProductImageIndex(0);
    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const addModifier = (mod: ModifierOption & {recipes?: any[]}) => {
    setSelectedModifiers([...selectedModifiers, mod]);
  };

  const removeModifier = (mod: ModifierOption & {recipes?: any[]}) => {
    const index = selectedModifiers.findIndex(m => m.id === mod.id);
    if (index !== -1) {
      const newModifiers = [...selectedModifiers];
      newModifiers.splice(index, 1);
      setSelectedModifiers(newModifiers);
    }
  };

  const handleAddToCart = () => {
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
    });
    
    closeModal();
  };

  // Filter products based on active category and search term
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    // If searching, show all matching products across all categories
    if (searchTerm.trim() !== '') {
      return true;
    }

    if (activeCategory === promoTabName) {
      return p.isPromo;
    }
    return p.category?.name === activeCategory;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="catalog-layout">
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 900px) {
          .catalog-layout {
            grid-template-columns: 1fr 380px !important;
            align-items: start;
          }
        }
      `}} />
      <div className="catalog-content">
        
        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar productos, ingredientes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', outlineColor: 'var(--color-primary)' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Banners Carousel */}
        {banners.length > 0 && (
          <div style={{ marginBottom: '2rem', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: 'transparent', boxShadow: 'var(--shadow-sm)' }}>
            {banners.map((banner, index) => (
              <a 
                key={banner.id}
                href={banner.link || '#'}
                style={{
                  display: 'block',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  opacity: index === currentBannerIndex ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                  zIndex: index === currentBannerIndex ? 1 : 0,
                  backgroundColor: 'transparent'
                }}
              >
                <img src={banner.imageUrl} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </a>
            ))}
            {banners.length > 1 && (
              <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                {banners.map((_, idx) => (
                  <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === currentBannerIndex ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category sticky tab navigation */}
        {searchTerm.trim() === '' && categoriesList.length > 0 && (
          <nav className="category-nav">
            {categoriesList.map(catName => (
              <button
                key={catName}
                className={`category-tab ${activeCategory === catName ? 'active' : ''}`}
                onClick={() => setActiveCategory(catName)}
              >
                {catName === promoTabName ? `⭐ ${promoTabName}` : catName}
              </button>
            ))}
          </nav>
        )}

        {/* Selected Category Products */}
        {activeCategory && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--color-red-light)', paddingBottom: '0.5rem', display: 'inline-block' }}>
              {searchTerm.trim() !== '' ? `Búsqueda: "${searchTerm}"` : (activeCategory === promoTabName ? 'Ofertas Destacadas' : activeCategory)}
            </h2>
            
            <div className="grid" style={{ 
              gridTemplateColumns: cardLayout === 'list' ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem',
              maxWidth: cardLayout === 'list' ? '800px' : '100%',
              margin: cardLayout === 'list' ? '0 auto' : '0'
            }}>
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="card flex justify-between hover-card" 
                  onClick={() => isOpen && openModal(product)} 
                  style={{ 
                    cursor: isOpen ? 'pointer' : 'not-allowed', 
                    opacity: isOpen ? 1 : 0.6,
                    padding: '1rem', 
                    minHeight: '130px', 
                    gap: '1rem' 
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{product.name}</h3>
                      {product.description && (
                        <p className="text-muted" style={{ 
                          fontSize: '0.85rem', 
                          marginBottom: '0.5rem', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden' 
                        }}>
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      {product.comboItems && product.comboItems.length > 0 && (
                        <div className="text-muted" style={{ fontSize: '0.85rem', textDecoration: 'line-through' }}>
                          ${product.comboItems.reduce((sum: number, item: any) => sum + ((item.product?.price || 0) * item.quantity), 0).toLocaleString()}
                        </div>
                      )}
                      <p className="text-red text-bold" style={{ fontSize: '1.125rem' }}>
                        ${product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {product.imageUrl && (
                    <div style={{ flexShrink: 0 }}>
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          objectFit: 'cover', 
                          borderRadius: 'var(--border-radius-md)',
                          border: '1px solid var(--color-border)' 
                        }} 
                      />
                    </div>
                  )}
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-muted">No hay productos en esta categoría.</p>
              )}
            </div>
          </div>
        )}
      </div>
      <div id="cart-section" style={{ paddingBottom: '100px' }}>
        <Cart whatsappNumber={whatsappNumber} isOpen={isOpen} slug={slug} bankAlias={bankAlias} shippingFee={shippingFee} categories={categories} />
      </div>

      {/* Floating Cart Button (Mobile) */}
      {cartItemsCount > 0 && (
        <div className="floating-cart-wrapper" style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          width: '90%',
          maxWidth: '400px'
        }}>
          <button 
            onClick={() => document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: 'var(--color-category-btn)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '30px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span>Ver Carrito ({cartItemsCount})</span>
            <span>${getTotal(slug).toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content flex flex-col" onClick={e => e.stopPropagation()} style={{ padding: '1.5rem', position: 'relative' }}>
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'white',
                color: '#1a1a1a',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              ✕
            </button>
            {/* Product Image Carousel */}
            {(selectedProduct.imageUrl || (selectedProduct.images && selectedProduct.images.length > 0)) && (
              <div style={{ position: 'relative', marginBottom: '1rem', width: '100%', height: '220px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                <div style={{
                  display: 'flex',
                  transition: 'transform 0.3s ease-in-out',
                  transform: `translateX(-${currentProductImageIndex * 100}%)`,
                  height: '100%'
                }}>
                  {selectedProduct.imageUrl && (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      style={{ width: '100%', flexShrink: 0, height: '100%', objectFit: 'cover' }} 
                    />
                  )}
                  {selectedProduct.images && selectedProduct.images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`${selectedProduct.name} - Imagen ${idx + 1}`} 
                      style={{ width: '100%', flexShrink: 0, height: '100%', objectFit: 'cover' }} 
                    />
                  ))}
                </div>
                
                {/* Carousel Controls */}
                {((selectedProduct.imageUrl ? 1 : 0) + (selectedProduct.images?.length || 0) > 1) && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentProductImageIndex(prev => prev > 0 ? prev - 1 : prev);
                      }}
                      style={{
                        position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                        cursor: 'pointer', zIndex: 5, display: currentProductImageIndex > 0 ? 'block' : 'none'
                      }}
                    >
                      ❮
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const totalImages = (selectedProduct.imageUrl ? 1 : 0) + (selectedProduct.images?.length || 0);
                        setCurrentProductImageIndex(prev => prev < totalImages - 1 ? prev + 1 : prev);
                      }}
                      style={{
                        position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                        cursor: 'pointer', zIndex: 5, display: currentProductImageIndex < ((selectedProduct.imageUrl ? 1 : 0) + (selectedProduct.images?.length || 0) - 1) ? 'block' : 'none'
                      }}
                    >
                      ❯
                    </button>
                    <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {Array.from({ length: (selectedProduct.imageUrl ? 1 : 0) + (selectedProduct.images?.length || 0) }).map((_, idx) => (
                        <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === currentProductImageIndex ? '#000' : 'rgba(0,0,0,0.3)' }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{selectedProduct.name}</h2>
            {selectedProduct.comboItems && selectedProduct.comboItems.length > 0 && (
              <div className="text-muted" style={{ fontSize: '1rem', textDecoration: 'line-through', marginBottom: '0.25rem' }}>
                Precio regular: ${selectedProduct.comboItems.reduce((sum: number, item: any) => sum + ((item.product?.price || 0) * item.quantity), 0).toLocaleString()}
              </div>
            )}
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>{selectedProduct.description}</p>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
              {selectedProduct.modifiers.filter(m => m.type === 'FREE' && m.isActive).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--color-red-primary)', fontWeight: 'bold' }}>
                    Modificadores Gratuitos
                  </h4>
                  <div className="grid" style={{ gap: '0.5rem' }}>
                    {selectedProduct.modifiers.filter(m => m.type === 'FREE' && m.isActive).map(mod => {
                      const qty = selectedModifiers.filter(m => m.id === mod.id).length;
                      const isOutOfStock = mod.recipes && mod.recipes.length > 0 ? mod.recipes.some(r => r.ingredient && r.ingredient.currentStock < (r.quantityUsed * (qty + 1) * quantity)) : false;
                      return (
                        <div key={mod.id} className="flex justify-between items-center" style={{ padding: '0.25rem 0', opacity: (isOutOfStock && qty === 0) ? 0.5 : 1 }}>
                          <div>
                            <span style={{ fontSize: '0.875rem' }}>
                              {mod.name} {mod.description ? `(${mod.description})` : ''}
                            </span>
                            {isOutOfStock && qty === 0 && <span className="text-red text-bold" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>(Agotado)</span>}
                          </div>
                          <div className="flex items-center" style={{ gap: '0.75rem', background: 'var(--color-bg-light)', borderRadius: 'var(--border-radius-sm)', padding: '0.25rem' }}>
                            <button 
                              type="button" 
                              onClick={() => removeModifier(mod)} 
                              disabled={qty === 0}
                              style={{ width: '28px', height: '28px', border: 'none', background: 'white', borderRadius: '4px', cursor: qty === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >-</button>
                            <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{qty}</span>
                            <button 
                              type="button" 
                              onClick={() => addModifier(mod)} 
                              disabled={isOutOfStock}
                              style={{ width: '28px', height: '28px', border: 'none', background: 'white', borderRadius: '4px', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedProduct.modifiers.filter(m => m.type === 'PAID' && m.isActive).length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--color-green)', fontWeight: 'bold' }}>
                    Extras Pagos
                  </h4>
                  <div className="grid" style={{ gap: '0.5rem' }}>
                    {selectedProduct.modifiers.filter(m => m.type === 'PAID' && m.isActive).map(mod => {
                      const qty = selectedModifiers.filter(m => m.id === mod.id).length;
                      const isOutOfStock = mod.recipes && mod.recipes.length > 0 ? mod.recipes.some(r => r.ingredient && r.ingredient.currentStock < (r.quantityUsed * (qty + 1) * quantity)) : false;
                      return (
                        <div key={mod.id} className="flex justify-between items-center" style={{ padding: '0.25rem 0', opacity: (isOutOfStock && qty === 0) ? 0.5 : 1 }}>
                          <div>
                            <span style={{ fontSize: '0.875rem' }}>
                              {mod.name} {mod.description ? `(${mod.description})` : ''}
                            </span>
                            {isOutOfStock && qty === 0 && <span className="text-red text-bold" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>(Agotado)</span>}
                            <span className="text-green text-bold" style={{ display: 'block', fontSize: '0.85rem', marginTop: '2px' }}>+${mod.price}</span>
                          </div>
                          <div className="flex items-center" style={{ gap: '0.75rem', background: 'var(--color-bg-light)', borderRadius: 'var(--border-radius-sm)', padding: '0.25rem' }}>
                            <button 
                              type="button" 
                              onClick={() => removeModifier(mod)} 
                              disabled={qty === 0}
                              style={{ width: '28px', height: '28px', border: 'none', background: 'white', borderRadius: '4px', cursor: qty === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >-</button>
                            <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{qty}</span>
                            <button 
                              type="button" 
                              onClick={() => addModifier(mod)} 
                              disabled={isOutOfStock}
                              style={{ width: '28px', height: '28px', border: 'none', background: 'white', borderRadius: '4px', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn-outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span className="text-bold" style={{ fontSize: '1.25rem' }}>{quantity}</span>
                <button className="btn-outline" onClick={() => setQuantity(quantity + 1)}>+</button>
                {selectedProduct.allowBulkQuantities && (
                  <div className="flex" style={{ gap: '0.5rem', marginLeft: '0.5rem' }}>
                    <button className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => setQuantity(quantity + 6)}>+6</button>
                    <button className="btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => setQuantity(quantity + 12)}>+12</button>
                  </div>
                )}
              </div>
              <button 
                className="btn-primary" 
                style={{ width: 'auto' }} 
                onClick={handleAddToCart}
              >
                Agregar ${( (selectedProduct.price + selectedModifiers.reduce((sum, m) => sum + m.price, 0)) * quantity ).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer Powered By Polosandia */}
      <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '0.75rem' }}>Desarrollado por</p>
        <img src="/logo.png" alt="Polosandia" style={{ height: '50px', opacity: 0.9 }} />
      </div>
    </div>
  );
}
