"use client";

import Sidebar from '@/components/dashbord/Sidebar';
import ProductsSection from '@/components/dashbord/ProductsSection';
import OrdersSection from '@/components/dashbord/OrdersSection';
import CmsSection from '@/components/dashbord/CmsSection';
import QnaSection from '@/components/dashbord/QnaSection';
import UsersSection from '@/components/dashbord/UsersSection';
import DeliverySection from '@/components/dashbord/DeliverySection';
import ProductModal from '@/components/dashbord/ProductModal';
import DeleteModal from '@/components/dashbord/DeleteModal';
import NotificationBell from '@/components/dashbord/NotificationBell';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useEffect } from 'react';


const CATEGORIES = ['gâteau', 'aliments traditionnel'];

export default function DashboardPage() {
  const { activeTab, openCreate, toast, setToast } = useDashboardStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);


  return (
    <main
      dir="ltr"
      className="flex min-h-screen flex-col bg-surface text-on-surface md:flex-row"
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col">
        <header className="md:sticky md:top-0 z-20 flex h-auto min-h-[5rem] py-md md:py-0 md:h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md px-gutter shadow-soft flex-wrap gap-md">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface">
            {activeTab === 'products'
              ? 'Gérer les produits'
              : activeTab === 'orders'
              ? 'Gestion des commandes'
              : activeTab === 'cms'
              ? 'Configuration du site (CMS)'
              : activeTab === 'qna'
              ? 'Questions & Réponses'
              : activeTab === 'users'
              ? 'Gestion des utilisateurs'
              : 'Méthodes de livraison'}
          </h1>
          <div className="flex items-center gap-md">
            <div className="hidden md:block">
              <NotificationBell />
            </div>
            
            {activeTab === 'products' && (
              <button
                onClick={() => openCreate(CATEGORIES[0])}
                className="inline-flex items-center gap-xs rounded-full bg-primary px-sm py-xs text-xs font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02] md:px-md md:py-sm md:text-sm md:font-semibold"
              >
                <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">Ajouter un nouveau produit</span>
                <span className="inline sm:hidden">Ajouter</span>
              </button>
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-container-max flex-1 p-gutter">
          {activeTab === 'products' ? (
            <ProductsSection />
          ) : activeTab === 'orders' ? (
            <OrdersSection />
          ) : activeTab === 'cms' ? (
            <CmsSection />
          ) : activeTab === 'qna' ? (
            <QnaSection />
          ) : activeTab === 'users' ? (
            <UsersSection />
          ) : activeTab === 'delivery-methods' ? (
            <DeliverySection />
          ) : (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-xl text-center shadow-soft">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-sm">tab_unselected</span>
              <p className="text-on-surface-variant font-medium">Onglet non trouvé</p>
            </div>
          )}
        </div>
      </section>

      {/* Add / Edit Form Modal */}
      <ProductModal />

      {/* Delete Confirmation Modal */}
      <DeleteModal />

      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] rounded-xl px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in border ${
            toast.type === 'success'
              ? 'bg-emerald-600 border-emerald-500/30'
              : 'bg-error border-error-container/20'
          }`}
        >
          <span className="material-symbols-outlined text-xl select-none">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-semibold text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-xs hover:opacity-80 transition-opacity p-0.5 rounded-full hover:bg-white/10"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-base block select-none">close</span>
          </button>
        </div>
      )}
    </main>
  );
}