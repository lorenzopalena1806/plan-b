import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartModifier {
  id: number;
  name: string;
  price: number;
  type: string;
}

export interface CartItem {
  cartItemId: string; // Unique ID for the cart line item (since same product can have different modifiers)
  productId: number;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: CartModifier[];
  categoryId?: number;
  categoryName?: string;
  totalPrice: number; // basePrice + modifiers prices * quantity
}

interface CartState {
  carts: Record<string, CartItem[]>;
  deliveryMethod: 'TAKEAWAY' | 'DELIVERY';
  customerName: string;
  address: string;
  customerNotes: string;
  setDeliveryMethod: (method: 'TAKEAWAY' | 'DELIVERY') => void;
  setCustomerName: (name: string) => void;
  setAddress: (address: string) => void;
  setCustomerNotes: (notes: string) => void;
  addItem: (slug: string, item: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => void;
  removeItem: (slug: string, cartItemId: string) => void;
  updateQuantity: (slug: string, cartItemId: string, quantity: number) => void;
  clearCart: (slug: string) => void;
  getItems: (slug: string) => CartItem[];
  getTotal: (slug: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      deliveryMethod: 'TAKEAWAY',
      customerName: '',
      address: '',
      customerNotes: '',
      
      setDeliveryMethod: (method) => set({ deliveryMethod: method }),
      setCustomerName: (name) => set({ customerName: name }),
      setAddress: (address) => set({ address }),
      setCustomerNotes: (customerNotes) => set({ customerNotes }),
      
      addItem: (slug, item) => set((state) => {
        const modifiersPrice = item.modifiers.reduce((sum, mod) => sum + mod.price, 0);
        const itemTotalPrice = (item.basePrice + modifiersPrice) * item.quantity;
        const cartItemId = Math.random().toString(36).substr(2, 9);
        const currentItems = state.carts[slug] || [];
        
        return {
          carts: {
            ...state.carts,
            [slug]: [...currentItems, { ...item, cartItemId, totalPrice: itemTotalPrice }]
          }
        };
      }),
      
      removeItem: (slug, cartItemId) => set((state) => {
        const currentItems = state.carts[slug] || [];
        return {
          carts: {
            ...state.carts,
            [slug]: currentItems.filter((i) => i.cartItemId !== cartItemId)
          }
        };
      }),
      
      updateQuantity: (slug, cartItemId, quantity) => set((state) => {
        const currentItems = state.carts[slug] || [];
        return {
          carts: {
            ...state.carts,
            [slug]: currentItems.map((i) => {
              if (i.cartItemId === cartItemId) {
                const modifiersPrice = i.modifiers.reduce((sum, mod) => sum + mod.price, 0);
                return {
                  ...i,
                  quantity,
                  totalPrice: (i.basePrice + modifiersPrice) * quantity,
                };
              }
              return i;
            })
          }
        };
      }),
      
      clearCart: (slug) => set((state) => ({ 
        carts: { ...state.carts, [slug]: [] }, 
        customerName: '', 
        address: '', 
        customerNotes: '' 
      })),
      
      getItems: (slug) => {
        return get().carts[slug] || [];
      },
      
      getTotal: (slug) => {
        const items = get().carts[slug] || [];
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
      },
    }),
    {
      name: 'plan-b-multi-cart', // New key to avoid conflicts with old state
    }
  )
);

