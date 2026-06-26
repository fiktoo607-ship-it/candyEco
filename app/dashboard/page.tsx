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
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md px-gutter shadow-soft">
          <h1 className="font-display text-3xl font-bold text-on-surface">
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
            <NotificationBell />
            
            {activeTab === 'products' && (
              <button
                onClick={() => openCreate(CATEGORIES[0])}
                className="inline-flex items-center gap-xs rounded-full bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter un nouveau produit
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