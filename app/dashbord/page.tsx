"use client";

import Sidebar from '@/components/dashbord/Sidebar';
import ProductsSection from '@/components/dashbord/ProductsSection';
import OrdersSection from '@/components/dashbord/OrdersSection';
import ProductModal from '@/components/dashbord/ProductModal';
import DeleteModal from '@/components/dashbord/DeleteModal';
import { useDashboardStore } from '@/lib/dashboard-store';

const CATEGORIES = ['Viennoiseries', 'Gâteaux', 'Biscuits', 'Pâtisseries', 'Boulangerie'];

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
            {activeTab === 'products' ? 'Manage Products' : 'Orders Management'}
          </h1>
          {activeTab === 'products' && (
            <button
              onClick={() => openCreate(CATEGORIES[0])}
              className="inline-flex items-center gap-xs rounded-full bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add New Product
            </button>
          )}
        </header>

        <div className="mx-auto w-full max-w-container-max flex-1 p-gutter">
          {activeTab === 'products' ? <ProductsSection /> : <OrdersSection />}
        </div>
      </section>

      {/* Add / Edit Form Modal */}
      <ProductModal />

      {/* Delete Confirmation Modal */}
      <DeleteModal />
    </main>
  );
}