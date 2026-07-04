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

const CATEGORIES = ['gâteau', 'aliments traditionnel'];

export default function DashboardPage() {
  const { activeTab, openCreate } = useDashboardStore();

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
          ) : (
            <DeliverySection />
          )}
        </div>
      </section>

      {/* Add / Edit Form Modal */}
      <ProductModal />

      {/* Delete Confirmation Modal */}
      <DeleteModal />
    </main>
  );
}