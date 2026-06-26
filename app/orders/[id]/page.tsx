"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Order } from '@/lib/hooks/use-orders';

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Commande introuvable');
          }
          throw new Error('Impossible de charger les détails de la commande');
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchOrder, 15000); // Poll status periodically

    fetchOrder();

    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de l’annulation');
      }
      const updatedOrder = await res.json();
      setOrder(updatedOrder);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { key: 'PENDING', label: 'En attente', icon: 'hourglass_empty', desc: 'Votre commande est en cours de validation par nos équipes.' },
    { key: 'ACCEPTED', label: 'Acceptée', icon: 'check_circle', desc: 'Votre commande a été acceptée et est en cours de préparation.' }
  ];

  // Helper to determine active step index
  const getActiveStepIndex = (status: string) => {
    const uppercaseStatus = status.toUpperCase();
    if (uppercaseStatus === 'CANCELLED') return -1;
    return steps.findIndex(step => step.key === uppercaseStatus);
  };

  const activeIndex = order ? getActiveStepIndex(order.status) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      
      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-gutter py-xl w-full">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <p className="text-on-surface-variant mt-sm">Chargement des détails du suivi...</p>
          </div>
        ) : error || !order ? (
          <div className="mx-auto max-w-md text-center py-20">
            <span className="material-symbols-outlined text-5xl text-error mb-sm">error</span>
            <h2 className="text-2xl font-bold text-on-surface">Oups ! Commande introuvable</h2>
            <p className="mt-sm text-on-surface-variant">{error || 'Cette commande n’existe pas ou a été annulée.'}</p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              Retour aux produits
            </Link>
          </div>
        ) : (
          <div className="space-y-lg">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md border-b border-outline-variant/30 pb-md">
              <div>
                <h1 className="font-display text-4xl font-bold text-on-surface">Suivi de Commande</h1>
                <p className="text-sm font-mono text-on-surface-variant mt-[4px]">
                  Réf: {order.reference || `#${order.id.toUpperCase()}`}
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-xs text-on-surface-variant">Statut actuel :</span>
                {order.status === 'CANCELLED' ? (
                  <span className="rounded-full bg-rose-500/10 px-sm py-[2px] text-xs font-bold text-rose-600 uppercase">
                    Annulée
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-sm py-[2px] text-xs font-bold text-emerald-600 uppercase">
                    {steps[activeIndex]?.label || order.status}
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Timeline */}
            {order.status === 'CANCELLED' ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-md text-center">
                <span className="material-symbols-outlined text-rose-600 text-3xl mb-xs">cancel</span>
                <h3 className="font-bold text-rose-800 text-lg">Commande Annulée</h3>
                <p className="text-sm text-rose-700/80 mt-xs">Cette commande a été annulée. N’hésitez pas à contacter notre service client pour plus d’informations.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-xl shadow-soft">
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-lg md:gap-xs">
                  {/* Progress Line Background (Desktop) */}
                  <div className="absolute top-[21px] left-8 right-8 h-1 bg-outline-variant/20 hidden md:block -z-10" />
                  
                  {/* Progress Line Active (Desktop) */}
                  <div 
                    className="absolute top-[21px] left-8 h-1 bg-emerald-500 transition-all duration-500 hidden md:block -z-10" 
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 92}%` }}
                  />

                  {steps.map((step, idx) => {
                    const isCompleted = idx <= activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div key={step.key} className="flex md:flex-col items-center md:text-center gap-md md:gap-xs flex-1 w-full relative">
                        {/* Step Icon Node */}
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-emerald-500 text-white shadow-soft ring-4 ring-emerald-500/15' 
                            : 'bg-surface-container-high text-on-surface-variant border-2 border-outline-variant/40'
                        }`}>
                          <span className="material-symbols-outlined text-lg">{step.icon}</span>
                        </div>

                        {/* Step Details */}
                        <div className="flex flex-col md:items-center text-left md:text-center mt-xs">
                          <span className={`text-sm font-bold transition-colors ${isCompleted ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] text-emerald-600 font-medium md:max-w-[150px] leading-tight mt-[2px] block">
                              {step.desc}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {/* Customer & Shipping card */}
              <div className="md:col-span-2 space-y-md">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-soft">
                  <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/15 pb-xs mb-sm">Détails de Livraison</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm text-sm">
                    <div>
                      <span className="text-xs text-on-surface-variant block">Nom complet</span>
                      <span className="font-semibold text-on-surface">{order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant block">Téléphone</span>
                      <span className="font-semibold text-on-surface">{order.customerPhone}</span>
                    </div>
                    {order.customerEmail && (
                      <div>
                        <span className="text-xs text-on-surface-variant block">Adresse E-mail</span>
                        <span className="font-semibold text-on-surface">{order.customerEmail}</span>
                      </div>
                    )}
                    {order.deliveryMethod && (
                      <div>
                        <span className="text-xs text-on-surface-variant block">Mode de livraison</span>
                        <span className="font-semibold text-primary">{order.deliveryMethod}</span>
                      </div>
                    )}
                    {order.shippingAddress && (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-on-surface-variant block">Adresse</span>
                        <span className="font-medium text-on-surface">{order.shippingAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items card */}
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-soft">
                  <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/15 pb-xs mb-sm">Articles commandés</h3>
                  <div className="divide-y divide-outline-variant/10">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-sm first:pt-0 last:pb-0">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface text-sm">{item.product?.title || 'Produit'}</span>
                          <span className="text-xs text-on-surface-variant">Prix unitaire: {item.priceAtPurchase}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order summary card */}
              <div className="md:col-span-1">
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-soft sticky top-24 space-y-md">
                  <h3 className="text-base font-bold text-on-surface border-b border-outline-variant/15 pb-xs mb-sm">Résumé de la Commande</h3>
                  
                  <div className="space-y-xs text-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Sous-total</span>
                      <span className="font-medium text-on-surface">{order.totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Points gagnés</span>
                      <span className="font-semibold text-emerald-600">+{order.pointsEarned} pts</span>
                    </div>
                    <div className="border-t border-outline-variant/10 pt-sm flex justify-between items-center">
                      <span className="font-bold text-on-surface">Total payé</span>
                      <span className="text-xl font-bold text-primary">{order.totalPrice}</span>
                    </div>
                  </div>

                  <div className="pt-xs flex flex-col gap-sm">
                    <Link
                      href="/our-product"
                      className="w-full inline-flex justify-center items-center rounded-xl bg-primary py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint text-sm text-center"
                    >
                      Continuer les achats
                    </Link>

                    {order.status === 'PENDING' && (
                      <button
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                        className="w-full inline-flex justify-center items-center rounded-xl border border-rose-300 bg-rose-50/50 py-sm font-bold text-rose-700 shadow-soft transition-transform active:scale-95 hover:bg-rose-100/50 text-sm disabled:opacity-50"
                      >
                        {cancelling ? 'Annulation...' : 'Annuler la commande'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
