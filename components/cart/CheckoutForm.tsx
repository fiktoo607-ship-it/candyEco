import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useSubmitOrder } from '@/lib/hooks/use-orders';
import dictionary from '@/lib/copy-dictionary.json';
import { useConfig } from '@/lib/hooks/use-config';

interface CheckoutFormProps {
  onSuccess: (orderId: string) => void;
}

interface DeliveryMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { items, clearCart, getTotalPrice } = useCartStore();
  const submitOrderMutation = useSubmitOrder();

  const { data: config } = useConfig();
  const storeEnabled = config?.store_enabled !== false;
  const storeMessage = config?.store_message || "Le magasin est temporairement fermé.";

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/delivery-methods');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setDeliveryMethods(data);
            setSelectedMethod(data[0].name);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching delivery methods:', err);
      }

      // Local fallback
      const fallbacks: DeliveryMethod[] = [
        { id: 'fd-1', name: 'Home Delivery', description: 'Livraison à domicile', price: 0, active: true },
        { id: 'fd-2', name: 'Office Pickup', description: 'Retrait au bureau', price: 0, active: true },
        { id: 'fd-3', name: 'Store Pickup', description: 'Retrait en magasin', price: 0, active: true },
      ];
      setDeliveryMethods(fallbacks);
      setSelectedMethod(fallbacks[0].name);
    };

    fetchMethods();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeEnabled) {
      alert("La boutique est fermée pour le moment. Prise de commande impossible.");
      return;
    }
    if (items.length === 0) return;

    if (!customerName || !customerPhone || !shippingAddress || !selectedMethod) {
      alert(dictionary.cart.form.validationError);
      return;
    }

    setPhoneError('');
    setEmailError('');

    const phoneRegex = /^\+?[0-9\s\-()]{6,25}$/;
    if (!phoneRegex.test(customerPhone)) {
      setPhoneError('Veuillez saisir un numéro de téléphone valide.');
      return;
    }

    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        setEmailError('Veuillez saisir une adresse e-mail valide.');
        return;
      }
    }

    const payload = {
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      shippingAddress,
      deliveryMethod: selectedMethod,
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const createdOrder = await submitOrderMutation.mutateAsync(payload);
      clearCart();
      onSuccess(createdOrder.id);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : dictionary.cart.form.submitError);
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft sticky top-24">
      <h2 className="text-xl font-bold text-on-surface mb-md">{dictionary.cart.form.title}</h2>
      
      <div className="flex justify-between items-center text-base mb-md border-b border-outline-variant/20 pb-sm">
        <span className="text-on-surface-variant font-medium">{dictionary.cart.form.total}</span>
        <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
      </div>

      <form onSubmit={handleCheckout} className="space-y-sm">
        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            {dictionary.cart.form.nameLabel}
          </label>
          <input
            type="text"
            required
            placeholder={dictionary.cart.form.namePlaceholder}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            {dictionary.cart.form.phoneLabel}
          </label>
          <input
            type="tel"
            required
            placeholder={dictionary.cart.form.phonePlaceholder}
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              if (phoneError) setPhoneError('');
            }}
            className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary text-left ${
              phoneError ? 'border-error' : 'border-outline-variant'
            }`}
            dir="ltr"
          />
          {phoneError && <p className="text-xs text-error mt-xs">{phoneError}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            Adresse E-mail (Optionnel)
          </label>
          <input
            type="email"
            placeholder="Ex: client@example.com"
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
              emailError ? 'border-error' : 'border-outline-variant'
            }`}
          />
          {emailError && <p className="text-xs text-error mt-xs">{emailError}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface-variant mb-xs">
            {dictionary.cart.form.addressLabel}
          </label>
          <input
            type="text"
            required
            placeholder={dictionary.cart.form.addressPlaceholder}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary"
          />
        </div>

        {/* Delivery Method Selection */}
        <div className="pt-xs">
          <label className="block text-sm font-bold text-on-surface-variant mb-sm">
            Mode de livraison
          </label>
          <div className="space-y-xs">
            {deliveryMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-start gap-sm rounded-xl border p-sm cursor-pointer transition-all ${
                  selectedMethod === method.name
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant bg-surface-container-low hover:bg-surface-container-high'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method.name}
                  checked={selectedMethod === method.name}
                  onChange={() => setSelectedMethod(method.name)}
                  className="mt-[3px] accent-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">
                    {method.name === 'Home Delivery'
                      ? 'Home Delivery (Livraison à domicile)'
                      : method.name === 'Office Pickup'
                      ? 'Office Pickup (Retrait au bureau)'
                      : method.name === 'Store Pickup'
                      ? 'Store Pickup (Retrait en magasin)'
                      : method.name}
                  </span>
                  {method.description && (
                    <span className="text-xs text-on-surface-variant mt-[2px]">{method.description}</span>
                  )}
                  {method.price > 0 && (
                    <span className="text-xs font-semibold text-primary mt-[2px]">+${method.price.toFixed(2)}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {!storeEnabled && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-sm text-amber-800 text-sm flex items-start gap-xs mt-md">
            <span className="material-symbols-outlined text-base flex-shrink-0 mt-[2px]">warning</span>
            <div>
              <p className="font-bold">Boutique temporairement fermée</p>
              <p className="text-xs mt-[2px]">{storeMessage}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!storeEnabled || submitOrderMutation.isPending}
          className="w-full rounded-xl bg-primary py-md mt-md text-base font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-xs"
        >
          {submitOrderMutation.isPending && (
            <span className="material-symbols-outlined text-base animate-spin">sync</span>
          )}
          {!storeEnabled ? "Commandes désactivées" : dictionary.cart.form.submitButton}
        </button>
      </form>
    </div>
  );
}
