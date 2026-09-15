"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useClientDevice } from "@/hooks/useClientDevice";
import Image from "next/image";

export default function AdminProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { setActiveTab } = useDashboardStore();
  const { deviceInfo: clientDevice } = useClientDevice();
  const { data: session, update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize name from session or fetch latest profile
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  // Fetch full details and active admin sessions when opened
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      fetch("/api/users/profile")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.user?.name) {
            setName(data.user.name);
          }
        })
        .catch(() => {});

      fetch("/api/admin/session/active")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.activeSessions) {
            setActiveSessions(data.activeSessions);
          }
        })
        .catch(() => {});
    } else {
      setIsEditing(false);
      setFeedback(null);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Veuillez entrer un nom valide." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de la mise à jour");
      }

      setFeedback({ type: "success", message: "Nom modifié avec succès !" });
      setIsEditing(false);
      if (updateSession) {
        await updateSession({ name: name.trim() });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  };

  const displayName = mounted ? (session?.user?.name || name || "Administrateur") : "Administrateur";
  const displayPhone = mounted ? (session?.user?.phone || "Non renseigné") : "Non renseigné";
  const displayEmail = mounted ? (session?.user?.email || "Non renseigné") : "Non renseigné";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Button / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-on-surface hover:bg-surface-container-low transition-all select-none focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-soft cursor-pointer"
        aria-label="Profil administrateur"
        aria-expanded={isOpen}
      >
        <div
          suppressHydrationWarning
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm shadow-sm flex-shrink-0"
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col text-left">
          <span
            suppressHydrationWarning
            className="text-xs font-bold text-on-surface leading-tight max-w-[120px] truncate"
          >
            {displayName}
          </span>
          <span className="text-[10px] text-primary font-semibold leading-tight">
            Admin
          </span>
        </div>

        <span className="material-symbols-outlined text-base text-on-surface-variant group-hover:text-primary transition-transform duration-200">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Backdrop for outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-none"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Card */}
      {isOpen && (
        <div className="fixed top-20 right-4 sm:absolute sm:top-full sm:right-0 sm:left-auto mt-2 w-80 max-w-[calc(100vw-2rem)] z-[95] rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-md shadow-xl backdrop-blur-md animate-fade-in flex flex-col gap-sm">
          {/* Header Info */}
          <div className="flex items-center gap-sm border-b border-outline-variant/20 pb-sm">
            <div
              suppressHydrationWarning
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white font-bold text-base shadow-sm"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Rôle : Administrateur
              </span>
              <h3
                suppressHydrationWarning
                className="text-sm font-bold text-on-surface truncate"
              >
                {displayName}
              </h3>
            </div>
          </div>

          {/* Quick Access to Full Profile Page */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setActiveTab("profile");
              if (pathname !== "/dashboard") {
                router.push("/dashboard/profile");
              }
            }}
            className="flex items-center justify-between gap-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary p-2.5 text-xs font-bold transition-all shadow-xs group"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">manage_accounts</span>
              <span>Voir le profil complet & Historique</span>
            </span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Current Device Highlight */}
          {clientDevice && (
            <div className="flex items-center gap-2 rounded-xl bg-sky-50/80 border border-sky-200/60 p-2 text-xs text-sky-900">
              <span className="material-symbols-outlined text-base text-sky-600 flex-shrink-0">
                {clientDevice.deviceType === "mobile"
                  ? "smartphone"
                  : clientDevice.deviceType === "tablet"
                  ? "tablet"
                  : "desktop_windows"}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Votre Appareil</span>
                <span className="font-semibold truncate text-[11px]">{clientDevice.label}</span>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {feedback && (
            <div
              className={`text-xs px-sm py-1.5 rounded-lg flex items-center gap-1.5 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {feedback.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Info Details / Edit form */}
          <div className="flex flex-col gap-xs text-xs">
            {/* Name Section */}
            <div className="rounded-xl bg-surface-container-low/60 p-sm border border-outline-variant/30 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Nom
                </span>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setFeedback(null);
                    }}
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline hover:text-primary-hover"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveName} className="mt-1 flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Entrez votre nom..."
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-xs outline-none focus:border-primary"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(session?.user?.name || "");
                      }}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-white hover:bg-surface-tint active:scale-[0.98] disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      {loading && (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="font-semibold text-on-surface truncate">
                  {displayName}
                </p>
              )}
            </div>

            {/* Phone Section */}
            <div className="rounded-xl bg-surface-container-low/60 p-sm border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Numéro de Téléphone
              </span>
              <p className="font-semibold text-on-surface font-mono">
                {displayPhone}
              </p>
            </div>

            {/* Email Section */}
            <div className="rounded-xl bg-surface-container-low/60 p-sm border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Email
              </span>
              <p className="font-semibold text-on-surface truncate">
                {displayEmail}
              </p>
            </div>

            {/* Active Admin Sessions Section */}
            <div className="rounded-xl bg-surface-container-low/60 p-sm border border-outline-variant/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Admins connectés ({activeSessions.length} / 2)
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              {activeSessions.length === 0 ? (
                <p className="text-[11px] text-on-surface-variant italic">Chargement des sessions...</p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {activeSessions.map((admin, idx) => {
                    const isCurrent = admin.userId === session?.user?.id;
                    const diffSec = Math.floor((Date.now() - admin.loginAt) / 1000);
                    const timeLabel = diffSec < 60 ? "À l'instant" : diffSec < 3600 ? `Il y a ${Math.floor(diffSec / 60)} min` : `Il y a ${Math.floor(diffSec / 3600)} h`;

                    return (
                      <div
                        key={admin.sessionId || idx}
                        className={`flex flex-col gap-1 rounded-lg border p-2 text-[11px] shadow-xs ${
                          isCurrent
                            ? "border-primary/40 bg-primary/5"
                            : "border-outline-variant/30 bg-surface-container-lowest"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-on-surface">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary">person</span>
                            <span className="truncate max-w-[120px]">{admin.userName}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1 py-0.5 bg-primary text-white rounded font-medium">
                                Vous
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-normal text-on-surface-variant">
                            {timeLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-on-surface-variant font-mono text-[10px]">
                          <span className="material-symbols-outlined text-xs text-emerald-600">call</span>
                          <span>{admin.userPhone}</span>
                        </div>

                        {admin.deviceInfo && (
                          <div className="flex items-center gap-1 text-on-surface-variant text-[10px]">
                            <span className="material-symbols-outlined text-xs text-sky-600">
                              {admin.deviceInfo.deviceType === "mobile" ? "smartphone" : admin.deviceInfo.deviceType === "tablet" ? "tablet" : "desktop_windows"}
                            </span>
                            <span className="truncate">{admin.deviceInfo.label}</span>
                          </div>
                        )}

                        {admin.locationInfo?.label && (
                          <div className="flex items-center gap-1 text-on-surface-variant text-[10px]">
                            <span className="material-symbols-outlined text-xs text-amber-600">location_on</span>
                            <span className="truncate">{admin.locationInfo.label}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
