import { useDashboardStore } from '@/lib/dashboard-store';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <aside className="sticky top-0 z-20 flex w-full flex-col border-r border-outline-variant/30 bg-surface-container-lowest shadow-soft md:min-h-screen md:w-64">
      <div className="flex items-center gap-sm p-lg">
        <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
          bakery_dining
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-sm px-md">
        <button
          onClick={() => setActiveTab('products')}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === 'products'
              ? 'bg-primary-container/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
          }`}
        >
          Manage Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`rounded-lg px-md py-sm text-left transition-colors font-semibold ${
            activeTab === 'orders'
              ? 'bg-primary-container/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
          }`}
        >
          Orders
        </button>
      </nav>
      <div className="mt-auto border-t border-outline-variant/30 p-md">
        <a
          className="rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:text-primary"
          href="#logout"
        >
          Logout
        </a>
      </div>
    </aside>
  );
}
