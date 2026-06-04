"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useCartStore } from '@/lib/cart-store';
import { useSubmitOrder } from '@/lib/hooks/use-orders';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const submitOrderMutation = useSubmitOrder();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex max-w-container-max flex-1 flex-col items-center justify-center px-gutter py-xl">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!customerName || !customerPhone || !shippingAddress) {
      alert("الرجاء ملء جميع حقول الطلب");
      return;
    }

    const payload = {
      customerName,
      customerPhone,
      shippingAddress,
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      await submitOrderMutation.mutateAsync(payload);
      setIsSuccess(true);
      clearCart();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "فشل تقديم الطلب. يرجى المحاولة مرة أخرى.");
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl w-full" dir="rtl">
        <header className="text-center mb-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">سلة التسوق</p>
          <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">طلبك الحالي</h1>
        </header>

        {isSuccess ? (
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/50 p-xl text-center shadow-soft">
            <span className="material-symbols-outlined text-5xl text-emerald-600 mb-sm">check_circle</span>
            <h2 className="text-2xl font-bold text-on-surface">تم إرسال طلبك بنجاح!</h2>
            <p className="mt-md text-on-surface-variant leading-relaxed">
              شكرًا لطلبك. لقد تلقينا معلوماتك وسيقوم مسؤول المتجر بمعالجة طلبك قريباً.
            </p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              العودة إلى المنتجات
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-xl">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-sm">shopping_cart_off</span>
            <h2 className="text-2xl font-bold text-on-surface">سلة التسوق فارغة</h2>
            <p className="mt-sm text-on-surface-variant">لم تقم بإضافة أي منتجات إلى السلة بعد.</p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              تصفح منتجاتنا
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-xl lg:grid-cols-3">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-md">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-surface-variant/30 flex-shrink-0">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-on-surface line-clamp-1">{item.product.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-xs">{item.product.category}</p>
                    <p className="text-primary font-bold mt-xs">{item.product.price}</p>
                  </div>

                  {/* Quantity Controls & Remove */}
                  <div className="flex items-center gap-sm">
                    <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low h-9">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="px-sm py-1 hover:bg-surface-container-high font-bold transition-colors text-on-surface-variant"
                      >
                        -
                      </button>
                      <span className="px-md font-bold text-on-surface">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-sm py-1 hover:bg-surface-container-high font-bold transition-colors text-on-surface-variant"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="rounded-lg p-2 text-error hover:bg-error/10 transition-colors flex items-center justify-center"
                      title="حذف"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Guest Checkout Form & Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft sticky top-24">
                <h2 className="text-xl font-bold text-on-surface mb-md">تفاصيل الطلب</h2>
                
                <div className="flex justify-between items-center text-base mb-md border-b border-outline-variant/20 pb-sm">
                  <span className="text-on-surface-variant font-medium">المجموع الإجمالي</span>
                  <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                </div>

                <form onSubmit={handleCheckout} className="space-y-sm">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-xs">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك الكامل"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-xs">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 0612345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-xs">
                      العنوان / الموقع *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="المدينة، الحي، رقم الشارع"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitOrderMutation.isPending}
                    className="w-full rounded-xl bg-primary py-md mt-md text-base font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-xs"
                  >
                    {submitOrderMutation.isPending && (
                      <span className="material-symbols-outlined text-base animate-spin">sync</span>
                    )}
                    اطلب الآن
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
