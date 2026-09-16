"use client";

import Sidebar from "@/components/dashbord/Sidebar";
import ProductsSection from "@/components/dashbord/ProductsSection";
import OrdersSection from "@/components/dashbord/OrdersSection";
import CmsSection from "@/components/dashbord/CmsSection";
import QnaSection from "@/components/dashbord/QnaSection";
import UsersSection from "@/components/dashbord/UsersSection";
import DeliverySection from "@/components/dashbord/DeliverySection";
import ProfileSection from "@/components/dashbord/ProfileSection";
import ProductModal from "@/components/dashbord/ProductModal";
import DeleteModal from "@/components/dashbord/DeleteModal";
import NotificationBell from "@/components/dashbord/NotificationBell";
import AdminProfileMenu from "@/components/dashbord/AdminProfileMenu";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEffect } from "react";
import { useAdminSession } from "@/hooks/useAdminSession";

const CATEGORIES = ["gâteau", "aliments traditionnel"];

export default function DashboardPage() {
  useAdminSession();
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
      className="flex min-h-screen flex-col bg-surface text-on-surface desktop:flex-row"
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* Header: desktop:sticky handles desktop sticky layout. Overflow is visible so notification dropdown shows */}
        <header className="desktop:sticky desktop:top-0 z-20 flex h-auto min-h-[5rem] py-md desktop:py-0 desktop:h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md px-6 sm:px-gutter shadow-soft flex-wrap gap-md">
          {/* min-w-0 + flex-1 allow the title to shrink when the header is narrow */}
          <h1 className="min-w-0 flex-1 font-display text-xl desktop:text-3xl font-bold text-on-surface truncate pr-sm">
            {activeTab === "products"
              ? "Gérer les produits"
              : activeTab === "orders"
                ? "Gestion des commandes"
                : activeTab === "cms"
                  ? "Configuration du site (CMS)"
                  : activeTab === "qna"
                    ? "Questions & Réponses"
                    : activeTab === "users"
                      ? "Gestion des clients"
                      : activeTab === "profile"
                        ? "Profil Administrateur & Historique"
                        : "Méthodes de livraison"}
          </h1>
          {/* flex-shrink-0 ensures the action buttons area is never compressed */}
          <div className="flex items-center gap-sm flex-shrink-0">
            <div className="hidden desktop:block">
              <NotificationBell />
            </div>
            <AdminProfileMenu />
          </div>
        </header>

        <div className="w-full flex-1 p-6 sm:p-gutter">
          {activeTab === "products" ? (
            <ProductsSection />
          ) : activeTab === "orders" ? (
            <OrdersSection />
          ) : activeTab === "cms" ? (
            <CmsSection />
          ) : activeTab === "qna" ? (
            <QnaSection />
          ) : activeTab === "users" ? (
            <UsersSection />
          ) : activeTab === "delivery-methods" ? (
            <DeliverySection />
          ) : activeTab === "profile" ? (
            <ProfileSection />
          ) : (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-xl text-center shadow-soft">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-sm">
                tab_unselected
              </span>
              <p className="text-on-surface-variant font-medium">
                Onglet non trouvé
              </p>
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
          className={`fixed bottom-6 right-6 z-[90] rounded-xl px-md py-sm text-white shadow-lg flex items-center gap-sm animate-fade-in border ${
            toast.type === "success"
              ? "bg-emerald-600 border-emerald-500/30"
              : "bg-error border-error-container/20"
          }`}
        >
          <span className="material-symbols-outlined text-xl select-none">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-semibold text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-xs hover:opacity-80 transition-opacity p-0.5 rounded-full hover:bg-white/10"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-base block select-none">
              close
            </span>
          </button>
        </div>
      )}
    </main>
  );
}