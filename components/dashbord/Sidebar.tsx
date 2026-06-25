import { useDashboardStore } from '@/lib/dashboard-store';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <aside className="sticky top-0 z-20 flex w-full flex-col border-r border-outline-variant/30 bg-surface-container-lowest shadow-soft md:min-h-screen md:w-64">
      <div className="flex items-center gap-sm p-lg">
        <Image
          src="/logo-title.png"
          alt="Délices d'Eva Logo"
          width={198}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
      <nav className="flex flex-1 flex-col gap-sm px-md">
        <button
          onClick={() => setActiveTab("products")}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === "products"
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          Gérer les produits
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === "orders"
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          Commandes
        </button>
        <button
          onClick={() => setActiveTab("cms")}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === "cms"
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          Gestion de Contenu (CMS)
        </button>
        <button
          onClick={() => setActiveTab("qna")}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === "qna"
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          Questions & Réponses
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === "users"
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab("delivery-methods")}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === "delivery-methods"
              ? "bg-primary-container/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
          }`}
        >
          Méthodes de livraison
        </button>
      </nav>
      <div className="mt-auto border-t border-outline-variant/30 p-md flex flex-col">
        <button
          className="rounded-lg px-md py-sm text-left text-on-surface-variant transition-colors hover:text-error font-semibold"
          onClick={() => signOut({ callbackUrl: '/home' })}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
