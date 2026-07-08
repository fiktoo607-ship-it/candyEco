import { useDashboardStore } from '@/lib/dashboard-store';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1300);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const toggleCollapsed = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const activeCollapsed = isCollapsed && isDesktop;

  return (
    <aside className={`relative z-30 flex w-full flex-col bg-transparent desktop:min-h-screen ${activeCollapsed ? 'desktop:w-[72px]' : 'desktop:w-64'} transition-all duration-300`}>
      
      {/* Desktop Fixed Wrapper: overflow-visible prevents toggle button clipping. Fixed to viewport so it never scrolls away */}
      <div className={`w-full h-full desktop:h-screen desktop:fixed desktop:top-0 desktop:left-0 desktop:bottom-0 ${activeCollapsed ? 'desktop:w-[72px]' : 'desktop:w-64'} transition-all duration-300 z-30 overflow-visible`}>
        
        {/* Collapse Toggle Button (Desktop Only): Centered on dividing line and stays fixed on scroll */}
        <button
          onClick={toggleCollapsed}
          className="hidden desktop:flex absolute top-6 -right-4 h-8 w-8 items-center justify-center rounded-full border border-outline-variant/35 bg-surface hover:bg-surface-container-low text-on-surface-variant focus:outline-none shadow-sm z-50 transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label={activeCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-lg select-none">
            {activeCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        {/* Sidebar Inner content scroll container */}
        <div className="flex w-full h-full flex-col border-b border-outline-variant/30 bg-surface-container-lowest shadow-soft desktop:border-b-0 desktop:border-r border-outline-variant/30 overflow-y-auto overflow-x-hidden">
          <div className={`flex items-center justify-between ${activeCollapsed ? 'p-md desktop:px-0 desktop:py-6 desktop:justify-center' : 'p-md desktop:p-lg desktop:justify-between'} relative`}>
            <Link href="/home" className="hover:opacity-85 transition-opacity">
              {activeCollapsed ? (
                <>
                  <Image
                    src="/logo.jpeg"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="hidden desktop:block h-8 w-8 rounded-full object-cover"
                  />
                  <Image
                    src="/logo-title.png"
                    alt="Délices d'Eva Logo"
                    width={198}
                    height={40}
                    className="desktop:hidden h-10 w-auto object-contain"
                    priority
                  />
                </>
              ) : (
                <Image
                  src="/logo-title.png"
                  alt="Délices d'Eva Logo"
                  width={160}
                  height={32}
                  className="h-8 w-auto object-contain"
                  priority
                />
              )}
            </Link>
            
            {/* Mobile Actions (Notification Bell next to Hamburger) */}
            <div className="flex items-center gap-sm desktop:hidden">
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
          <div className={`${isOpen ? 'flex animate-fade-in' : 'hidden'} desktop:flex flex-col flex-1 pb-md desktop:pb-0`}>
            <nav className={`flex flex-col gap-2 ${activeCollapsed ? 'px-2' : 'px-4'}`}>
              <button
                onClick={() => { setActiveTab("products"); setIsOpen(false); }}
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left transition-all duration-200 font-semibold w-full ${
                  activeTab === "products"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
                title={activeCollapsed ? "Gérer produits" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">bakery_dining</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Gérer produits</span>}
              </button>
              
              <button
                onClick={() => { setActiveTab("orders"); setIsOpen(false); }}
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left transition-all duration-200 font-semibold w-full ${
                  activeTab === "orders"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
                title={activeCollapsed ? "Commandes" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">shopping_bag</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Commandes</span>}
              </button>

              <button
                onClick={() => { setActiveTab("cms"); setIsOpen(false); }}
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left transition-all duration-200 font-semibold w-full ${
                  activeTab === "cms"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
                title={activeCollapsed ? "Gestion contenu" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">auto_stories</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Gestion contenu</span>}
              </button>

              <button
                onClick={() => { setActiveTab("qna"); setIsOpen(false); }}
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left transition-all duration-200 font-semibold w-full ${
                  activeTab === "qna"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
                title={activeCollapsed ? "Questions/Réponses" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">quiz</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Questions/Réponses</span>}
              </button>

              <button
                onClick={() => { setActiveTab("users"); setIsOpen(false); }}
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left transition-all duration-200 font-semibold w-full ${
                  activeTab === "users"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
                title={activeCollapsed ? "Utilisateurs" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">group</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Utilisateurs</span>}
              </button>

              <button
                onClick={() => { setActiveTab("delivery-methods"); setIsOpen(false); }}
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left transition-all duration-200 font-semibold w-full ${
                  activeTab === "delivery-methods"
                    ? "bg-primary-container/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
                title={activeCollapsed ? "Méthodes livraison" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">local_shipping</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Méthodes livraison</span>}
              </button>
            </nav>

            <div className={`mt-md border-t border-outline-variant/30 ${activeCollapsed ? 'p-xs' : 'p-md'} flex flex-col desktop:mt-auto`}>
              <button
                className={`flex items-center ${activeCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-left text-on-surface-variant transition-colors hover:text-error font-semibold w-full`}
                onClick={() => { signOut({ callbackUrl: '/home' }); setIsOpen(false); }}
                title={activeCollapsed ? "Déconnexion" : undefined}
              >
                <span className="material-symbols-outlined text-xl select-none">logout</span>
                {!activeCollapsed && <span className="whitespace-nowrap">Déconnexion</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
