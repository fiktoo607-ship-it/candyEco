import { useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useSubmitOrder } from '@/lib/hooks/use-orders';

interface CheckoutFormProps {
  onSuccess: () => void;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { items, clearCart, getTotalPrice } = useCartStore();
  const submitOrderMutation = useSubmitOrder();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

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
      clearCart();
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "فشل تقديم الطلب. يرجى المحاولة مرة أخرى.");
    }
  };

  const totalPrice = getTotalPrice();

  return (
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
  );
}
