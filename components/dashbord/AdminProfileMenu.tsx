"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardStore } from "@/lib/dashboard-store";
import Image from "next/image";

export default function AdminProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useDashboardStore();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoToProfile = () => {
    setActiveTab("profile");
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  };

  const displayName = mounted ? (session?.user?.name || "Administrateur") : "Administrateur";
  const userImage = mounted ? session?.user?.image : undefined;
  const isProfileActive = mounted && activeTab === "profile";
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleGoToProfile}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-soft cursor-pointer active:scale-95 ${
        isProfileActive
          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low hover:border-primary/40"
      }`}
      aria-label="Profil administrateur"
      title="Profil Administrateur & Historique"
    >
      {userImage ? (
        <Image
          src={userImage}
          alt={displayName}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover shadow-sm transition-transform group-hover:scale-105"
        />
      ) : (
        <div
          suppressHydrationWarning
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105"
        >
          {initial}
        </div>
      )}
    </button>
  );
}
