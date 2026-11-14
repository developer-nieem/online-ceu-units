'use client';

import { CartProvider } from '@/components/cart/cart-context';
import { CelebrationProvider } from '@/components/celebration/celebration-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CelebrationProvider>
      <CartProvider>{children}</CartProvider>
    </CelebrationProvider>
  );
}
