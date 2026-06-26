'use client';

import { useState, useEffect } from 'react';
import { Product, Category, ModifierOption } from '@prisma/client';
import { useCartStore } from '@/store/cartStore';
import Cart from './Cart';

type ProductWithRelations = Product & {
  category: Category | null;
  modifiers: ModifierOption[];
};

export default function Catalog({ products, whatsappNumber, isOpen, slug, cardLayout = 'grid', bankAlias = '', shippingFee = 0 }: { products: ProductWithRelations[], whatsappNumber: string, isOpen: boolean, slug: string, cardLayout?: string, bankAlias?: string, shippingFee?: number }) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { addItem } = useCartStore();

  // Extract unique categories from products (excluding promos from regular category list)
  const regularCategories = Array.from(
    new Set(products.map(p => p.category?.name).filter(Boolean))
  ) as string[];

  // Determine if there are promos
  const hasPromos = products.some(p => p.isPromo);

  // Combine into a list of tabs
  const categoriesList = [...(hasPromos ? ['Promos'] : []), ...regularCategories];

  // Set default active category once categories are loaded
  useEffect(() => {
    if (categoriesList.length > 0 && !activeCategory) {
      setActiveCategory(categoriesList[0]);
    }
  }, [products]);

  const openModal = (product: ProductWithRelations) => {
    setSelectedProduct(product);
    setSelectedModifiers([]);
    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const toggleModifier = (mod: ModifierOption) => {
    if (selectedModifiers.some(m => m.id === mod.id)) {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
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

    if (activeCategory === 'Promos') {
      return p.isPromo;
    }
    return p.category?.name === activeCategory;
  });

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="catalog-content">
        
        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar hamburguesa, pizza, bebida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: '30px',
              fontSize: '1rem',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              outlineColor: 'var(--color-red-primary)',
              transition: 'all 0.2s ease',
            }}
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

        {/* Category sticky tab navigation */}
        {searchTerm.trim() === '' && categoriesList.length > 0 && (
          <nav className="category-nav">
            {categoriesList.map(catName => (
              <button
                key={catName}
                className={`category-tab ${activeCategory === catName ? 'active' : ''}`}
                onClick={() => setActiveCategory(catName)}
              >
                {catName === 'Promos' ? '⭐ Promociones' : catName}
              </button>
            ))}
          </nav>
        )}

        {/* Selected Category Products */}
        {activeCategory && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--color-red-light)', paddingBottom: '0.5rem', display: 'inline-block' }}>
              {searchTerm.trim() !== '' ? `Búsqueda: "${searchTerm}"` : (activeCategory === 'Promos' ? 'Promociones Destacadas' : activeCategory)}
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
                    <p className="text-red text-bold" style={{ fontSize: '1.125rem', marginTop: 'auto' }}>
                      ${product.price.toLocaleString()}
                    </p>
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

      <Cart whatsappNumber={whatsappNumber} isOpen={isOpen} slug={slug} bankAlias={bankAlias} shippingFee={shippingFee} />

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
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: 'var(--color-text)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            >
              ✕
            </button>
            {selectedProduct.imageUrl && (
              <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name} 
                style={{ 
                  width: '100%', 
                  height: '220px', 
                  objectFit: 'cover', 
                  borderRadius: 'var(--border-radius-md)', 
                  marginBottom: '1rem',
                  border: '1px solid var(--color-border)' 
                }} 
              />
            )}
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{selectedProduct.name}</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>{selectedProduct.description}</p>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
              {selectedProduct.modifiers.filter(m => m.type === 'FREE').length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--color-red-primary)', fontWeight: 'bold' }}>Modificadores Gratuitos</h4>
                  <div className="grid" style={{ gap: '0.5rem' }}>
                    {selectedProduct.modifiers.filter(m => m.type === 'FREE').map(mod => (
                      <label key={mod.id} className="flex items-center" style={{ gap: '0.75rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedModifiers.some(m => m.id === mod.id)} 
                          onChange={() => toggleModifier(mod)} 
                          style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-red-primary)' }}
                        />
                        <span>{mod.name} {mod.description ? `(${mod.description})` : ''}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.modifiers.filter(m => m.type === 'PAID').length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--color-green)', fontWeight: 'bold' }}>Extras Pagos</h4>
                  <div className="grid" style={{ gap: '0.5rem' }}>
                    {selectedProduct.modifiers.filter(m => m.type === 'PAID').map(mod => (
                      <label key={mod.id} className="flex justify-between items-center" style={{ gap: '0.75rem', cursor: 'pointer' }}>
                        <div className="flex items-center" style={{ gap: '0.75rem' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedModifiers.some(m => m.id === mod.id)} 
                            onChange={() => toggleModifier(mod)} 
                            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-green)' }}
                          />
                          <span>{mod.name} {mod.description ? `(${mod.description})` : ''}</span>
                        </div>
                        <span className="text-green text-bold">+${mod.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-center" style={{ gap: '1rem' }}>
                <button className="btn-outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span className="text-bold" style={{ fontSize: '1.25rem' }}>{quantity}</span>
                <button className="btn-outline" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleAddToCart}>
                Agregar ${( (selectedProduct.price + selectedModifiers.reduce((sum, m) => sum + m.price, 0)) * quantity ).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
