'use client';

import { ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCart } from '@/components/cart/cart-context';
import { formatOnlineCeuHours } from '@/lib/ceu-display';
import { buildCheckoutPath } from '@/lib/checkout-path';
import { formatPrice } from '@/lib/pricing';

export type IndividualCourseStoreItem = {
  slug: string;
  title: string;
  categoryName: string;
  ceHours: number;
  price: number;
};

export function IndividualCoursesStore({ courses }: { courses: IndividualCourseStoreItem[] }) {
  const { items, add, remove, clear, has, count, subtotal } = useCart();
  const [open, setOpen] = useState(false);
  const firstItem = items[0];

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="mt-10 space-y-4">
      <div className="sticky top-4 z-10 flex justify-end">
        <button
          type="button"
          aria-label={`Open cart (${count} item${count === 1 ? '' : 's'})`}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="relative rounded-md p-2 text-slate-700 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          onClick={() => setOpen(true)}
        >
          <ShoppingCart className="size-5" aria-hidden strokeWidth={2} />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] leading-none text-white">
              {count}
            </span>
          ) : null}
        </button>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {courses.map((course) => {
          const inCart = has(course.slug);
          return (
            <li
              key={course.slug}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{course.title}</p>
                {course.categoryName ? (
                  <p className="mt-0.5 text-xs text-slate-500">{course.categoryName}</p>
                ) : null}
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                  <span>{formatOnlineCeuHours(course.ceHours)}</span>
                  <span className="font-medium text-teal-800">{formatPrice(course.price)}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {inCart ? (
                  <>
                    <span className="text-sm font-medium text-emerald-700">In cart ✓</span>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      onClick={() => remove(course.slug)}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    onClick={() =>
                      add({ slug: course.slug, title: course.title, price: course.price })
                    }
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close cart overlay"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Your cart ({count})</h2>
              <button
                type="button"
                aria-label="Close cart"
                className="rounded-md p-2 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" aria-hidden strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {count === 0 ? (
                <p className="text-sm text-slate-500">
                  No courses selected yet. Add modules to get started.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.slug} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-teal-800">{formatPrice(item.price)}</p>
                        <Link
                          href={buildCheckoutPath('single', item.slug, item.title)}
                          className="mt-1 inline-block text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
                        >
                          Checkout
                        </Link>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        onClick={() => remove(item.slug)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {count > 0 ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Subtotal</span>
                  <span className="text-base font-semibold text-slate-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  onClick={() => clear()}
                >
                  Clear cart
                </button>

                {firstItem ? (
                  <Link
                    href={buildCheckoutPath('single', firstItem.slug, firstItem.title)}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-6 font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Proceed to checkout
                  </Link>
                ) : null}

                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Modules are purchased individually at $3.75 each. You&apos;ll check out one module
                  at a time.
                </p>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
