import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/cart-store';
import { useSubmitOrder } from '@/lib/hooks/use-orders';
import dictionary from '@/lib/copy-dictionary.json';
import { useConfig } from '@/lib/hooks/use-config';
import PriceDisplay from '@/components/PriceDisplay';

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
  const { data: session } = useSession();
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
  
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [formError, setFormError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !customerName) {
        setCustomerName(session.user.name);
      }
      if (session.user.phone && !customerPhone) {
        setCustomerPhone(session.user.phone);
      }
      if (session.user.email && !customerEmail) {
        setCustomerEmail(session.user.email);
      }
    }
  }, [session]);

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
    };

    fetchMethods();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (isOffline) {
      setFormError("Vous êtes hors ligne. Veuillez vous connecter à Internet pour passer commande.");
      return;
    }
    if (!storeEnabled) {
      setFormError("La boutique est fermée pour le moment. Prise de commande impossible.");
      return;
    }

    setNameError('');
    setPhoneError('');
    setEmailError('');
    setAddressError('');
    setFormError('');

    let hasFieldErrors = false;
    if (!customerName.trim()) {
      setNameError(dictionary.cart.form.nameLabel ? `${dictionary.cart.form.nameLabel} est requis.` : 'Veuillez saisir votre nom.');
      hasFieldErrors = true;
    }

    if (!customerPhone.trim()) {
      setPhoneError(dictionary.cart.form.phoneLabel ? `${dictionary.cart.form.phoneLabel} est requis.` : 'Veuillez saisir un numéro de téléphone.');
      hasFieldErrors = true;
    } else {
      const phoneRegex = /^\+?[0-9\s\-()]{6,25}$/;
      if (!phoneRegex.test(customerPhone)) {
        setPhoneError('Veuillez saisir un numéro de téléphone valide.');
        hasFieldErrors = true;
      }
    }

    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        setEmailError('Veuillez saisir une adresse e-mail valide.');
        hasFieldErrors = true;
      }
    }

    if (!shippingAddress.trim()) {
      setAddressError(dictionary.cart.form.addressLabel ? `${dictionary.cart.form.addressLabel} est requise.` : 'Veuillez saisir votre adresse.');
      hasFieldErrors = true;
    }

    if (hasFieldErrors || !selectedMethod) {
      setFormError(dictionary.cart.form.validationError);
      return;
    }

    if (items.length === 0) return;

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
      setFormError(err instanceof Error ? err.message : dictionary.cart.form.submitError);
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft sticky top-24">
      <h2 className="text-xl font-bold text-on-surface mb-md">{dictionary.cart.form.title}</h2>
      
      <div className="flex justify-between items-center text-base mb-md border-b border-outline-variant/20 pb-sm">
        <span className="text-on-surface-variant font-medium">{dictionary.cart.form.total}</span>
        <span className="text-2xl font-bold text-primary"><PriceDisplay price={totalPrice} /></span>
      </div>

      {/* Inline Form Error Banner */}
      {formError && (
        <div className="mb-sm rounded-xl bg-error-container/40 border border-error/20 p-sm text-sm font-medium text-error flex items-start gap-xs animate-fade-in">
          <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleCheckout} className="space-y-sm" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-on-surface-variant mb-xs">
            {dictionary.cart.form.nameLabel}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={dictionary.cart.form.namePlaceholder}
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (nameError) setNameError('');
            }}
            aria-invalid={nameError ? "true" : undefined}
            aria-describedby={nameError ? "name-error" : undefined}
            className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
              nameError ? 'border-error' : 'border-outline-variant'
            }`}
          />
          {nameError && <p id="name-error" className="text-xs text-error mt-xs">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-on-surface-variant mb-xs">
            {dictionary.cart.form.phoneLabel}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder={dictionary.cart.form.phonePlaceholder}
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              if (phoneError) setPhoneError('');
            }}
            aria-invalid={phoneError ? "true" : undefined}
            aria-describedby={phoneError ? "phone-error" : undefined}
            className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary text-left ${
              phoneError ? 'border-error' : 'border-outline-variant'
            }`}
            dir="ltr"
          />
          {phoneError && <p id="phone-error" className="text-xs text-error mt-xs">{phoneError}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-bold text-on-surface-variant mb-xs">
            Adresse E-mail (Optionnel)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Ex: client@example.com"
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            aria-invalid={emailError ? "true" : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
            className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
              emailError ? 'border-error' : 'border-outline-variant'
            }`}
          />
          {emailError && <p id="email-error" className="text-xs text-error mt-xs">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-bold text-on-surface-variant mb-xs">
            {dictionary.cart.form.addressLabel}
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            placeholder={dictionary.cart.form.addressPlaceholder}
            value={shippingAddress}
            onChange={(e) => {
              setShippingAddress(e.target.value);
              if (addressError) setAddressError('');
            }}
            aria-invalid={addressError ? "true" : undefined}
            aria-describedby={addressError ? "address-error" : undefined}
            className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
              addressError ? 'border-error' : 'border-outline-variant'
            }`}
          />
          {addressError && <p id="address-error" className="text-xs text-error mt-xs">{addressError}</p>}
        </div>

        {/* Delivery Method Selection */}
        <fieldset className="pt-xs border-0 p-0 m-0">
          <legend className="block text-sm font-bold text-on-surface-variant mb-sm">
            Mode de livraison
          </legend>
          <div className="space-y-xs">
            {deliveryMethods.map((method) => {
              const methodInputId = `delivery-method-${method.id}`;
              return (
                <label
                  key={method.id}
                  htmlFor={methodInputId}
                  className={`flex items-start gap-sm rounded-xl border p-sm cursor-pointer transition-all ${
                    selectedMethod === method.name
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container-high'
                  }`}
                >
                  <input
                    type="radio"
                    id={methodInputId}
                    name="deliveryMethod"
                    value={method.name}
                    checked={selectedMethod === method.name}
                    onChange={() => setSelectedMethod(method.name)}
                    className="mt-[3px] accent-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">
                      {method.name.toLowerCase().includes('yalidin')
                        ? 'Yalidine Express'
                        : method.name === 'Home Delivery'
                        ? 'Livraison à domicile'
                        : method.name === 'Office Pickup'
                        ? 'Retrait au bureau'
                        : method.name === 'Store Pickup'
                        ? 'Retrait en magasin'
                        : method.name}
                    </span>
                    {method.description && (
                      <span className="text-xs text-on-surface-variant mt-[2px]">{method.description}</span>
                    )}
                    {method.price > 0 && (
                      <span className="text-xs font-semibold text-primary mt-[2px]">+<PriceDisplay price={method.price} /></span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {!storeEnabled && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-sm text-amber-800 text-sm flex items-start gap-xs mt-md">
            <span className="material-symbols-outlined text-base flex-shrink-0 mt-[2px] notranslate" translate="no">warning</span>
            <div>
              <p className="font-bold">Boutique temporairement fermée</p>
              <p className="text-xs mt-[2px]">{storeMessage}</p>
            </div>
          </div>
        )}

        {isOffline && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-sm text-amber-800 text-sm flex items-start gap-xs mt-md">
            <span className="material-symbols-outlined text-base flex-shrink-0 mt-[2px] notranslate" translate="no">wifi_off</span>
            <div>
              <p className="font-bold">Vous êtes hors ligne</p>
              <p className="text-xs mt-[2px]">La validation de commande est désactivée sans connexion Internet.</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!storeEnabled || isOffline || submitOrderMutation.isPending}
          className="w-full rounded-xl bg-primary py-md mt-md text-base font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-xs"
        >
          {submitOrderMutation.isPending && (
            <span className="material-symbols-outlined text-base animate-spin">sync</span>
          )}
          {!storeEnabled ? "Commandes désactivées" : isOffline ? "Hors ligne" : dictionary.cart.form.submitButton}
        </button>
      </form>
    </div>
  );
}
