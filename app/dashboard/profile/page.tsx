"use client";

import Sidebar from "@/components/dashbord/Sidebar";
import ProfileSection from "@/components/dashbord/ProfileSection";
import NotificationBell from "@/components/dashbord/NotificationBell";
import AdminProfileMenu from "@/components/dashbord/AdminProfileMenu";
import { useAdminHeartbeat } from "@/hooks/useAdminHeartbeat";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEffect } from "react";

export default function AdminProfilePage() {
  useAdminHeartbeat();
  const { setActiveTab } = useDashboardStore();

  useEffect(() => {
    setActiveTab("profile");
  }, [setActiveTab]);

  return (
    <main
      dir="ltr"
      className="flex min-h-screen flex-col bg-surface text-on-surface desktop:flex-row"
    >
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col min-w-0">
        <header className="desktop:sticky desktop:top-0 z-20 flex h-auto min-h-[5rem] py-md desktop:py-0 desktop:h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md px-6 sm:px-gutter shadow-soft flex-wrap gap-md">
          <h1 className="min-w-0 flex-1 font-display text-xl desktop:text-3xl font-bold text-on-surface truncate pr-sm">
            Profil Administrateur & Historique
          </h1>
          <div className="flex items-center gap-sm flex-shrink-0">
            <div className="hidden desktop:block">
              <NotificationBell />
            </div>
            <AdminProfileMenu />
          </div>
        </header>

        <div className="w-full flex-1 p-6 sm:p-gutter">
          <ProfileSection />
        </div>
      </section>
    </main>
  );
}
