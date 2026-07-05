import { useDashboardStore } from '@/lib/dashboard-store';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="sticky top-0 z-30 flex w-full flex-col border-b border-outline-variant/30 bg-surface-container-lowest shadow-soft md:min-h-screen md:w-64 md:border-b-0 md:border-r">
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
        
        {/* Mobile Actions (Notification Bell next to Hamburger) */}
        <div className="flex items-center gap-sm md:hidden">
          <NotificationBell />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-container-low text-on-surface focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-2xl select-none">
              {isOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation container - hidden on mobile unless open */}
      <div className={`${isOpen ? 'flex animate-fade-in' : 'hidden'} md:flex flex-col flex-1 pb-md md:pb-0`}>
        <nav className="flex flex-col gap-sm px-md">
          <button
            onClick={() => { setActiveTab("products"); setIsOpen(false); }}
            className={`flex items-center gap-sm rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "products"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl select-none">bakery_dining</span>
            <span>Gérer les produits</span>
          </button>
          <button
            onClick={() => { setActiveTab("orders"); setIsOpen(false); }}
            className={`flex items-center gap-sm rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "orders"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl select-none">shopping_bag</span>
            <span>Commandes</span>
          </button>
          <button
            onClick={() => { setActiveTab("cms"); setIsOpen(false); }}
            className={`flex items-center gap-sm rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "cms"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl select-none">auto_stories</span>
            <span>Gestion de Contenu (CMS)</span>
          </button>
          <button
            onClick={() => { setActiveTab("qna"); setIsOpen(false); }}
            className={`flex items-center gap-sm rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "qna"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl select-none">quiz</span>
            <span>Questions & Réponses</span>
          </button>
          <button
            onClick={() => { setActiveTab("users"); setIsOpen(false); }}
            className={`flex items-center gap-sm rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "users"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl select-none">group</span>
            <span>Utilisateurs</span>
          </button>
          <button
            onClick={() => { setActiveTab("delivery-methods"); setIsOpen(false); }}
            className={`flex items-center gap-sm rounded-lg px-md py-sm text-left transition-colors font-semibold ${
              activeTab === "delivery-methods"
                ? "bg-primary-container/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-xl select-none">local_shipping</span>
            <span>Méthodes de livraison</span>
          </button>
        </nav>
        <div className="mt-md border-t border-outline-variant/30 p-md flex flex-col md:mt-auto">
          <button
            className="flex items-center gap-sm rounded-lg px-md py-sm text-left text-on-surface-variant transition-colors hover:text-error font-semibold"
            onClick={() => { signOut({ callbackUrl: '/home' }); setIsOpen(false); }}
          >
            <span className="material-symbols-outlined text-xl select-none">logout</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
