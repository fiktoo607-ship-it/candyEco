import { useDashboardStore } from '@/lib/dashboard-store';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="sticky top-0 z-20 flex w-full flex-col border-b border-outline-variant/30 bg-surface-container-lowest shadow-soft md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-md md:p-lg">
        <Link href="/home" className="hover:opacity-85 transition-opacity">
          <Image
            src="/logo-title.png"
            alt="Délices d'Eva Logo"
            width={198}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-container-low text-on-surface md:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-2xl select-none">
            {isOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Navigation container - hidden on mobile unless open */}
      <div className={`${isOpen ? 'flex animate-fade-in' : 'hidden'} md:flex flex-col flex-1 pb-md md:pb-0`}>
        <nav className="flex flex-col gap-sm px-md">
          <button
            onClick={() => { setActiveTab("products"); setIsOpen(false); }}
            className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "products"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            Gérer les produits
          </button>
          <button
            onClick={() => { setActiveTab("orders"); setIsOpen(false); }}
            className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "orders"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            Commandes
          </button>
          <button
            onClick={() => { setActiveTab("cms"); setIsOpen(false); }}
            className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "cms"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            Gestion de Contenu (CMS)
          </button>
          <button
            onClick={() => { setActiveTab("qna"); setIsOpen(false); }}
            className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "qna"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            Questions & Réponses
          </button>
          <button
            onClick={() => { setActiveTab("users"); setIsOpen(false); }}
            className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "users"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => { setActiveTab("delivery-methods"); setIsOpen(false); }}
            className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "delivery-methods"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            Méthodes de livraison
          </button>
        </nav>
        <div className="mt-md border-t border-outline-variant/30 p-md flex flex-col md:mt-auto">
          <button
            className="rounded-lg px-md py-sm text-left text-on-surface-variant transition-colors hover:text-error font-semibold"
            onClick={() => { signOut({ callbackUrl: '/home' }); setIsOpen(false); }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
