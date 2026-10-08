"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Order } from '@/lib/hooks/use-orders';
import PriceDisplay from "@/components/PriceDisplay";

import { ORDER_STATUS_CONFIG } from '@/types/orderStatusConfig';

function OrderSkeleton() {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
        <div className="space-y-xs flex-1">
          <div className="h-4 bg-outline-variant/30 rounded w-1/4" />
          <div className="h-6 bg-outline-variant/40 rounded w-2/5" />
          <div className="h-3 bg-outline-variant/20 rounded w-1/3" />
        </div>
        <div className="h-10 w-28 bg-outline-variant/30 rounded-xl" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchMyOrders = async () => {
      try {
        // Fetch orders associated to the logged-in user via session
        const res = await fetch('/api/orders?limit=50');
        if (!res.ok) throw new Error('Impossible de charger vos commandes.');
        const data = await res.json();
        // api returns { data, meta } shape
        setOrders(data.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-4xl flex-1 flex-col px-gutter py-xl w-full">
        {/* Page Header */}
        <div className="border-b border-outline-variant/30 pb-md mb-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Mon espace</p>
          <h1 className="mt-sm font-display text-4xl font-bold text-on-surface">Mes Commandes</h1>
          <p className="text-on-surface-variant mt-xs text-sm">
            {session?.user?.name && `Bonjour, ${session.user.name} \u2014 `}
            Retrouvez l&apos;historique et le statut de toutes vos commandes.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-md">
            {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <span className="material-symbols-outlined text-5xl text-error mb-sm">error</span>
            <h2 className="text-2xl font-bold text-on-surface">Une erreur est survenue</h2>
            <p className="mt-sm text-on-surface-variant">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-lg rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              Réessayer
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-sm select-none">package_2</span>
            <h2 className="text-2xl font-bold text-on-surface">Aucune commande pour le moment</h2>
            <p className="mt-sm text-on-surface-variant max-w-xs">
              Vous n&apos;avez pas encore passé de commande. Découvrez nos produits et commandez en quelques clics&nbsp;!
            </p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="space-y-md">
            {orders.map((order) => {
              const statusKey = order.status.toUpperCase();
              const statusInfo = ORDER_STATUS_CONFIG[statusKey as keyof typeof ORDER_STATUS_CONFIG];
              const label = statusInfo?.label || order.status;
              const badgeClass = statusInfo?.badgeClass || 'bg-neutral-100 text-neutral-800';

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
                    {/* Order Info */}
                    <div className="flex-1 space-y-xs">
                      <div className="flex flex-wrap items-center gap-sm">
                        <span
                          className={`rounded-full px-sm py-[2px] text-xs font-bold uppercase ${badgeClass}`}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-on-surface-variant font-mono">
                          {order.reference ?? `#${order.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </div>

                      <p className="text-lg font-bold text-on-surface">
                        <PriceDisplay price={order.totalPrice} />
                        <span className="ml-sm text-sm font-normal text-on-surface-variant">
                          &nbsp;&middot;&nbsp;{order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </span>
                      </p>

                      <p className="text-xs text-on-surface-variant">
                        Passée le{' '}
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {order.deliveryMethod && ` \u00b7 ${order.deliveryMethod}`}
                      </p>

                      {/* Product thumbnails */}
                      {order.items.length > 0 && (
                        <div className="flex gap-xs mt-xs">
                          {order.items.slice(0, 4).map((item) =>
                            item.product?.imageUrl ? (
                              <div
                                key={item.id}
                                className="relative h-10 w-10 overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-variant flex-shrink-0"
                              >
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.title ?? 'Produit'}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                            ) : null
                          )}
                          {order.items.length > 4 && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container text-xs font-bold text-on-surface-variant">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-xs rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm font-semibold text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-all whitespace-nowrap self-start sm:self-center"
                    >
                      <span className="material-symbols-outlined text-base select-none">open_in_new</span>
                      Voir le suivi
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
