"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Order } from '@/lib/hooks/use-orders';
import PriceDisplay from '@/components/PriceDisplay';
import { ORDER_STATUS_CONFIG } from '@/types/orderStatusConfig';
import { containsArabic } from '@/lib/a11y';
import { OrderPrintReceipt } from '@/components/dashbord/helpers/OrderPrintReceipt';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState('');
  const [token, setToken] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  // Check URL params on initial load
  useEffect(() => {
    const urlRef = searchParams.get('reference') || searchParams.get('ref');
    const urlToken = searchParams.get('token') || searchParams.get('phone') || searchParams.get('email');
    if (urlRef) setReference(urlRef);
    if (urlToken) setToken(urlToken);

    if (urlRef && urlToken) {
      executeTrack(urlRef, urlToken);
    }
  }, [searchParams]);

  const executeTrack = async (refVal: string, tokenVal: string) => {
    if (!refVal.trim()) {
      setError('Veuillez saisir votre numéro de commande.');
      return;
    }
    if (!tokenVal.trim()) {
      setError('Veuillez renseigner votre téléphone ou email de vérification.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: refVal.trim(),
          token: tokenVal.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Commande introuvable ou coordonnées incorrectes');
      }

      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la recherche.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTrack(reference, token);
  };

  const steps = [
    { key: 'PENDING', label: 'En attente', icon: 'hourglass_empty', desc: 'Votre commande est en cours de validation.' },
    { key: 'ACCEPTED', label: 'Acceptée', icon: 'check_circle', desc: 'Votre commande est confirmée et en préparation.' },
    { key: 'DELIVERED', label: 'Livrée', icon: 'local_shipping', desc: 'Votre commande a été livrée avec succès !' }
  ];

  const getActiveStepIndex = (status: string) => {
    const uppercaseStatus = status.toUpperCase();
    if (uppercaseStatus === 'CANCELLED') return -1;
    return steps.findIndex(step => step.key === uppercaseStatus);
  };

  const activeIndex = order ? getActiveStepIndex(order.status) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />

      <main id="main-content" className="mx-auto flex max-w-4xl flex-1 flex-col px-gutter py-xl w-full">
        {/* Page Title */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-3">
            <span className="material-symbols-outlined text-3xl">local_shipping</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-on-surface">
            Suivi de Commande Client
          </h1>
          <p className="text-on-surface-variant text-sm mt-xs max-w-md mx-auto">
            Suivez l'avancement de votre commande en direct en saisissant votre référence et vos coordonnées.
          </p>
        </div>

        {/* Tracking Search Form */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft mb-xl">
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label htmlFor="reference" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Référence de la commande <span className="text-primary">*</span>
                </label>
                <input
                  id="reference"
                  type="text"
                  required
                  placeholder="ex: ORD-20261008-001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface px-md py-sm text-sm font-mono text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="token" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Téléphone ou Email associé <span className="text-primary">*</span>
                </label>
                <input
                  id="token"
                  type="text"
                  required
                  placeholder="ex: 0555123456 ou client@exemple.com"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface px-md py-sm text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-sm text-xs font-medium text-rose-700 flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-xl py-sm rounded-xl bg-primary text-white font-bold text-sm shadow-soft hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Recherche en cours...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">search</span>
                  Rechercher ma commande
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Details Display */}
        {order && (
          <div className="space-y-lg animate-fade-in">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md border-b border-outline-variant/30 pb-md">
              <div>
                <h2 className="font-display text-2xl font-bold text-on-surface">
                  Commande #{order.reference || order.id}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Enregistrée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-sm">
                {(() => {
                  const statusInfo = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG];
                  const label = statusInfo?.label || order.status;
                  const bgClass = statusInfo?.bg || 'bg-surface-container text-on-surface-variant';
                  return (
                    <span className={`rounded-full px-sm py-[4px] text-xs font-bold uppercase tracking-wide ${bgClass}`}>
                      {label}
                    </span>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-[4px] text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Reçu
                </button>
              </div>
            </div>

            {/* Stepper Timeline */}
            {order.status === "CANCELLED" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-md text-center">
                <span className="material-symbols-outlined text-rose-600 text-3xl mb-xs">
                  cancel
                </span>
                <h3 className="font-bold text-rose-800 text-lg">
                  Commande Annulée
                </h3>
                <p className="text-sm text-rose-700/80 mt-xs">
                  Cette commande a été annulée. Contactez le service client pour toute question.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-xl shadow-soft">
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-lg md:gap-xs">
                  <div className="absolute top-[21px] left-8 right-8 h-1 bg-outline-variant/20 hidden md:block -z-10" />
                  <div
                    className="absolute top-[21px] left-8 h-1 bg-emerald-500 transition-all duration-500 hidden md:block -z-10"
                    style={{
                      width: `${(Math.max(0, activeIndex) / (steps.length - 1)) * 92}%`,
                    }}
                  />

                  {steps.map((step, idx) => {
                    const isCompleted = idx <= activeIndex;
                    return (
                      <div
                        key={step.key}
                        className="flex md:flex-col items-center md:text-center gap-md md:gap-xs flex-1 w-full relative"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-soft ring-4 ring-emerald-500/15"
                              : "bg-surface-container-high text-on-surface-variant border-2 border-outline-variant/40"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {step.icon}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">
                            {step.label}
                          </p>
                          <p className="text-xs text-on-surface-variant hidden md:block max-w-[150px] mx-auto mt-[2px]">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Customer & Delivery */}
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">
                  Informations de Livraison
                </h3>
                <div className="space-y-xs text-xs text-on-surface">
                  <p><span className="font-semibold text-on-surface-variant">Destinataire :</span> {order.customerName}</p>
                  <p><span className="font-semibold text-on-surface-variant">Téléphone :</span> {order.customerPhone}</p>
                  {order.customerEmail && (
                    <p><span className="font-semibold text-on-surface-variant">Email :</span> {order.customerEmail}</p>
                  )}
                  <p dir={containsArabic(order.shippingAddress || '') ? 'rtl' : 'ltr'}>
                    <span className="font-semibold text-on-surface-variant">Adresse :</span> {order.shippingAddress}
                  </p>
                  {order.deliveryMethod && (
                    <p><span className="font-semibold text-on-surface-variant">Mode de livraison :</span> {order.deliveryMethod}</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">
                  Récapitulatif Financier
                </h3>
                <div className="flex justify-between items-center text-sm py-xs">
                  <span className="text-on-surface-variant">Total des articles :</span>
                  <span className="font-medium">{order.items?.length || 0} article(s)</span>
                </div>
                <div className="border-t border-outline-variant/20 pt-sm flex justify-between items-center font-bold text-base">
                  <span>Montant Total :</span>
                  <PriceDisplay price={order.totalPrice} className="text-primary text-lg" />
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft">
              <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant mb-md">
                Articles Commandés
              </h3>
              <div className="divide-y divide-outline-variant/20">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-sm flex items-center justify-between gap-md">
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">
                        {item.product?.title || 'Produit artisanal'}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-[2px]">
                        Quantité : <span className="font-semibold">x{item.quantity}</span> • Prix unit. : {item.priceAtPurchase}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-on-surface">
                        {item.amountAtPurchase ? (item.amountAtPurchase * item.quantity).toFixed(2) + ' €' : item.priceAtPurchase}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && (
              <OrderPrintReceipt order={order} onClose={() => setShowReceipt(false)} />
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
