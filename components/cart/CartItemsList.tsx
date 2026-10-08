import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import dictionary from '@/lib/copy-dictionary.json';
import PriceDisplay from '@/components/PriceDisplay';
import { containsArabic } from '@/lib/a11y';

export default function CartItemsList() {
  const { items, removeItem, updateQuantity } = useCartStore();

  return (
    <div className="space-y-md">
      {items.map((item) => {
        const maxQty = item.product.limitBay && item.product.limitBay > 0 ? item.product.limitBay : undefined;

        return (
          <div
            key={item.product.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm sm:gap-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-sm sm:p-md shadow-soft"
          >
            {/* Product Image & Info Group */}
            <div className="flex items-center gap-sm sm:gap-md flex-1 min-w-0">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-surface-variant/30 flex-shrink-0">
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-on-surface line-clamp-1">
                  {containsArabic(item.product.title) ? (
                    <span lang="ar" dir="rtl">{item.product.title}</span>
                  ) : (
                    item.product.title
                  )}
                </h3>
                <p className="text-sm text-on-surface-variant mt-xs">{item.product.category}</p>
                <p className="text-primary font-bold mt-xs"><PriceDisplay price={item.product.price} /></p>
                {maxQty !== undefined && (
                  <p className="text-xs text-outline mt-[2px]">Max. {maxQty} par commande</p>
                )}
              </div>
            </div>

            {/* Quantity Controls & Remove */}
            <div className="flex items-center justify-between sm:justify-end gap-sm sm:gap-md w-full sm:w-auto border-t border-outline-variant/20 pt-sm sm:border-t-0 sm:pt-0">
              {/* Item Total Price */}
              {(() => {
                const priceNum = parseFloat(item.product.price.replace(/[^0-9.]/g, ''));
                const itemTotal = (isNaN(priceNum) ? 0 : priceNum) * item.quantity;
                return (
                  <div className="flex flex-col items-start sm:items-end sm:min-w-[120px] mr-0 sm:mr-sm">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-semibold sm:hidden">Sous-total</span>
                    <span className="text-base sm:text-lg font-bold text-primary"><PriceDisplay price={itemTotal} /></span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-on-surface-variant/70 hidden sm:block">
                        <PriceDisplay price={item.product.price} /> × {item.quantity}
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center gap-xs sm:gap-sm">
                <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low h-9">
                  <button
                    type="button"
                    aria-label="Diminuer la quantité"
                    onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className="px-sm py-1 hover:bg-surface-container-high font-bold transition-colors text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    -
                  </button>
                  <span className="px-md font-bold text-on-surface">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Augmenter la quantité"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={maxQty !== undefined && item.quantity >= maxQty}
                    title={maxQty !== undefined && item.quantity >= maxQty ? `Limite maximale: ${maxQty}` : undefined}
                    className="px-sm py-1 hover:bg-surface-container-high font-bold transition-colors text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  aria-label="Supprimer cet article"
                  onClick={() => {
                    if (window.confirm("Voulez-vous vraiment supprimer cet article de votre panier ?")) {
                      removeItem(item.product.id);
                    }
                  }}
                  className="rounded-lg p-2 text-error hover:bg-error/10 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title={dictionary.cart.list.remove}
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
