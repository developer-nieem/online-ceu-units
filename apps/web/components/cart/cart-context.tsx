'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type CartItem = { slug: string; title: string; price: number }; // price in dollars

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'calace_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, loaded]);

  // Best-effort: if the user is on a course learn page after a successful checkout, drop that course from the cart.
  // Uses window.location (NOT useSearchParams) to avoid forcing dynamic rendering of all pages.
  useEffect(() => {
    if (!loaded) return;
    try {
      const match = window.location.pathname.match(/^\/courses\/([^/]+)\/learn/);
      if (match && new URLSearchParams(window.location.search).get('checkout') === 'success') {
        const slug = match[1]!;
        setItems((prev) => prev.filter((i) => i.slug !== slug));
      }
    } catch { /* ignore */ }
  }, [loaded]);

  const add = useCallback((item: CartItem) => setItems((p) => (p.some((i) => i.slug === item.slug) ? p : [...p, item])), []);
  const remove = useCallback((slug: string) => setItems((p) => p.filter((i) => i.slug !== slug)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((slug: string) => items.some((i) => i.slug === slug), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has, count: items.length, subtotal: items.reduce((s, i) => s + (i.price || 0), 0) }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
