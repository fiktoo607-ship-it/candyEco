"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useClientDevice } from "@/hooks/useClientDevice";

interface HistoryRecord {
  id: string;
  userId?: string | null;
  userName: string;
  userPhone: string;
  userEmail?: string | null;
  role: string;
  deviceInfo: {
    deviceType: string;
    browser: string;
    os: string;
    label: string;
  };
  ip: string;
  location: string;
  status: string;
  createdAt: string;
  isActiveNow: boolean;
}

interface ActiveSessionItem {
  sessionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string | null;
  deviceInfo?: {
    browser: string;
    os: string;
    deviceType: "desktop" | "mobile" | "tablet";
    label: string;
  };
  locationInfo?: {
    ip: string;
    city?: string;
    country?: string;
    label: string;
  };
  loginAt: number;
  lastSeenAt: number;
}

function formatRelativeTime(dateStrOrTimestamp: string | number): string {
  const timestamp = typeof dateStrOrTimestamp === "string" ? new Date(dateStrOrTimestamp).getTime() : dateStrOrTimestamp;
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

function formatFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function ProfileSection() {
  const { data: session, update: updateSession } = useSession();
  const { deviceInfo: clientDevice, isMounted } = useClientDevice();

  // Profile edit state
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Sync name from session
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch active sessions
  const fetchActiveSessions = useCallback(async () => {
    try {
      setActiveLoading(true);
      const res = await fetch("/api/admin/session/active", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.activeSessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch active sessions:", err);
    } finally {
      setActiveLoading(false);
    }
  }, []);

  // Fetch login history
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        role: roleFilter,
      });
      if (debouncedQuery) {
        params.append("query", debouncedQuery);
      }

      const res = await fetch(`/api/admin/history?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Impossible de charger l'historique");
      }

      const data = await res.json();
      setHistory(data.history || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setHistoryError(err.message || "Erreur de chargement");
    } finally {
      setHistoryLoading(false);
    }
  }, [page, roleFilter, debouncedQuery]);

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Save updated name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileFeedback({ type: "error", message: "Le nom ne peut pas être vide." });
      return;
    }

    setProfileLoading(true);
    setProfileFeedback(null);

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

      setProfileFeedback({ type: "success", message: "Nom mis à jour avec succès !" });
      setIsEditingName(false);
      if (updateSession) {
        await updateSession({ name: name.trim() });
      }
    } catch (err: any) {
      setProfileFeedback({ type: "error", message: err.message || "Une erreur est survenue." });
    } finally {
      setProfileLoading(false);
    }
  };

  const displayName = isMounted ? (session?.user?.name || name || "Administrateur") : "Administrateur";
  const displayPhone = isMounted ? (session?.user?.phone || "Non renseigné") : "Non renseigné";
  const displayEmail = isMounted ? (session?.user?.email || "Non renseigné") : "Non renseigné";

  // Current user's active session in activeSessions list
  const currentActiveAdmin = activeSessions.find((s) => s.userId === session?.user?.id);

  return (
    <div className="flex flex-col gap-lg animate-fade-in max-w-7xl mx-auto w-full pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary/5 p-6 sm:p-8 shadow-soft">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-surface-tint text-white font-display text-3xl font-bold shadow-lg shadow-primary/25 ring-4 ring-primary/10">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-surface text-white text-[10px]" title="En ligne">
                ✓
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  <span className="material-symbols-outlined text-sm">shield_person</span>
                  Administrateur
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Session Active
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">security</span>
                Gestion du profil, sécurité multi-appareils et historique des sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => {
                fetchActiveSessions();
                fetchHistory();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-xs sm:text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all shadow-xs"
              title="Rafraîchir les données"
            >
              <span className={`material-symbols-outlined text-base ${historyLoading || activeLoading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid: Profile Info & Current Device Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile Details */}
        <div className="lg:col-span-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-7 shadow-soft flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">badge</span>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Informations du Compte
              </h2>
            </div>
            {!isEditingName && (
              <button
                onClick={() => {
                  setIsEditingName(true);
                  setProfileFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Modifier le nom</span>
              </button>
            )}
          </div>

          {profileFeedback && (
            <div
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                profileFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {profileFeedback.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom */}
            <div className="rounded-xl bg-surface-container-low/50 p-4 border border-outline-variant/20 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Nom complet
              </span>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex flex-col gap-2 mt-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-primary bg-surface px-3 py-1.5 text-sm font-semibold outline-none shadow-xs"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setName(session?.user?.name || "");
                      }}
                      className="rounded-lg px-3 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-surface-tint disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      {profileLoading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-base font-bold text-on-surface truncate">
                  {displayName}
                </p>
              )}
            </div>

            {/* Téléphone */}
            <div className="rounded-xl bg-surface-container-low/50 p-4 border border-outline-variant/20 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Numéro de téléphone
              </span>
              <p className="text-base font-bold text-on-surface font-mono">
                {displayPhone}
              </p>
            </div>

            {/* Email */}
            <div className="rounded-xl bg-surface-container-low/50 p-4 border border-outline-variant/20 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Adresse Email
              </span>
              <p className="text-base font-bold text-on-surface truncate">
                {displayEmail}
              </p>
            </div>

            {/* Rôle */}
            <div className="rounded-xl bg-surface-container-low/50 p-4 border border-outline-variant/20 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Privilèges
              </span>
              <p className="text-base font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                <span>Administrateur complet</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Current User Device */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-7 shadow-soft flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-sky-600 text-2xl">devices</span>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Votre Appareil Actuel
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
              Détecté
            </span>
          </div>

          {/* Device Highlight Box */}
          <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-sky-50 to-surface-container-low p-4 border border-sky-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20 flex-shrink-0">
              <span className="material-symbols-outlined text-3xl select-none">
                {clientDevice?.deviceType === "mobile"
                  ? "smartphone"
                  : clientDevice?.deviceType === "tablet"
                  ? "tablet"
                  : "desktop_windows"}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                {clientDevice?.deviceType === "mobile"
                  ? "Téléphone Mobile"
                  : clientDevice?.deviceType === "tablet"
                  ? "Tablette"
                  : "Ordinateur de bureau / PC"}
              </span>
              <p className="text-sm sm:text-base font-bold text-on-surface truncate">
                {clientDevice?.label || "Appareil en cours de détection..."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/15">
              <span className="text-on-surface-variant font-medium">Navigateur web :</span>
              <span className="font-bold text-on-surface">{clientDevice?.browser || "Inconnu"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/15">
              <span className="text-on-surface-variant font-medium">Système d'exploitation :</span>
              <span className="font-bold text-on-surface">{clientDevice?.os || "Inconnu"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/15">
              <span className="text-on-surface-variant font-medium">Localisation réseau :</span>
              <span className="font-bold text-on-surface truncate max-w-[180px]">
                {currentActiveAdmin?.locationInfo?.label || "Réseau local"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-on-surface-variant font-medium">Adresse IP :</span>
              <span className="font-mono font-bold text-on-surface">
                {currentActiveAdmin?.locationInfo?.ip || "127.0.0.1"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Concurrent Admin Sessions Widget */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-7 shadow-soft flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">supervisor_account</span>
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Sessions Administrateur Actives en Direct
              </h2>
              <p className="text-xs text-on-surface-variant">
                Limite de sécurité : maximum 2 administrateurs connectés simultanément
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-on-surface">
              Slots occupés : <strong className="text-primary">{activeSessions.length} / 2</strong>
            </span>
          </div>
        </div>

        {activeSessions.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low/50 p-6 text-center text-sm text-on-surface-variant italic">
            Aucune session active enregistrée en ce moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((admin, idx) => {
              const isCurrent = admin.userId === session?.user?.id;
              return (
                <div
                  key={admin.sessionId || idx}
                  className={`rounded-xl border p-4 transition-all flex flex-col gap-3 ${
                    isCurrent
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-outline-variant/30 bg-surface-container-low/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                        {admin.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                          {admin.userName}
                          {isCurrent && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                              Vous
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-mono text-on-surface-variant">
                          {admin.userPhone}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant">
                      {formatRelativeTime(admin.loginAt)}
                    </span>
                  </div>

                  {/* Device & Location Highlight */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2 text-on-surface font-medium">
                      <span className="material-symbols-outlined text-base text-sky-600 select-none">
                        {admin.deviceInfo?.deviceType === "mobile"
                          ? "smartphone"
                          : admin.deviceInfo?.deviceType === "tablet"
                          ? "tablet"
                          : "desktop_windows"}
                      </span>
                      <span className="truncate" title={admin.deviceInfo?.label}>
                        {admin.deviceInfo?.label || "Appareil inconnu"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-on-surface font-medium">
                      <span className="material-symbols-outlined text-base text-amber-600 select-none">
                        location_on
                      </span>
                      <span className="truncate" title={admin.locationInfo?.label}>
                        {admin.locationInfo?.label || "Localisation inconnue"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Login History Section */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-7 shadow-soft flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">history</span>
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Historique des Connexions
              </h2>
              <p className="text-xs text-on-surface-variant">
                Journal des utilisateurs connectés, de leurs informations, appareils et dates de connexion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-xl">
              Total : <strong className="text-primary">{totalCount}</strong> connexion{totalCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 border border-outline-variant/25">
            <button
              onClick={() => {
                setRoleFilter("all");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                roleFilter === "all"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => {
                setRoleFilter("admin");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                roleFilter === "admin"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => {
                setRoleFilter("user");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                roleFilter === "user"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Clients
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher utilisateur, appareil, IP..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-3 py-1.5 text-xs font-medium outline-none focus:border-primary focus:bg-surface transition-all"
            />
          </div>
        </div>

        {/* Error message */}
        {historyError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{historyError}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {historyLoading && (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <span className="text-xs font-semibold text-on-surface-variant">Chargement de l'historique...</span>
            </div>
          </div>
        )}

        {/* History Table (Desktop) */}
        {!historyLoading && history.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/70 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3.5 px-4">Utilisateur</th>
                  <th className="py-3.5 px-4">Rôle</th>
                  <th className="py-3.5 px-4">Appareil Utilisé</th>
                  <th className="py-3.5 px-4">Localisation & IP</th>
                  <th className="py-3.5 px-4">Date de Connexion</th>
                  <th className="py-3.5 px-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-container-low/40 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                          {record.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface truncate max-w-[160px]">
                            {record.userName}
                          </span>
                          <span className="text-[11px] font-mono text-on-surface-variant truncate max-w-[160px]">
                            {record.userPhone || record.userEmail || "—"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          record.role === "admin"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {record.role === "admin" ? "Admin" : "Client"}
                      </span>
                    </td>

                    {/* Prominent Device Display */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex-shrink-0">
                          <span className="material-symbols-outlined text-sm select-none">
                            {record.deviceInfo.deviceType === "mobile"
                              ? "smartphone"
                              : record.deviceInfo.deviceType === "tablet"
                              ? "tablet"
                              : "desktop_windows"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface truncate max-w-[200px]" title={record.deviceInfo.label}>
                            {record.deviceInfo.label}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                            <span>{record.deviceInfo.browser}</span>
                            <span>•</span>
                            <span>{record.deviceInfo.os}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location & IP */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface truncate max-w-[180px]">
                          {record.location}
                        </span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          {record.ip}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">
                          {formatFullDate(record.createdAt)}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {formatRelativeTime(record.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right">
                      {record.isActiveNow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant">
                          Déconnecté
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!historyLoading && history.length === 0 && (
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/30 p-12 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
              history_toggle_off
            </span>
            <p className="font-bold text-sm text-on-surface">
              Aucun historique de connexion trouvé
            </p>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Les connexions des administrateurs et des utilisateurs apparaîtront ici automatiquement avec l'appareil utilisé et la date.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {!historyLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 flex-wrap gap-3">
            <span className="text-xs text-on-surface-variant font-medium">
              Page <strong>{page}</strong> sur <strong>{totalPages}</strong> ({totalCount} connexions)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant/40 px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Précédent</span>
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant/40 px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Suivant</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
