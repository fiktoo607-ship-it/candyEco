"use client";

import React from "react";

export interface ActiveAdminInfo {
  sessionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string | null;
  deviceInfo?: {
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
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

interface ActiveAdminsWidgetProps {
  slotsOccupied: number;
  canViewDetails: boolean;
  showAdminsDetails: boolean;
  activeSessions: ActiveAdminInfo[];
  onToggleDetails: () => void;
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  return `Il y a ${diffHours} h`;
}

export default function ActiveAdminsWidget({
  slotsOccupied,
  canViewDetails,
  showAdminsDetails,
  activeSessions,
  onToggleDetails,
}: ActiveAdminsWidgetProps) {
  return (
    <div className="mt-md rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-sm transition-all">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex items-center gap-xs">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              slotsOccupied === 0
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                : slotsOccupied === 1
                ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"
            }`}
          />
          <span className="text-xs font-semibold text-on-surface">
            Admins connectés : <strong className="text-primary">{slotsOccupied} / 2</strong>
          </span>
        </div>

        {slotsOccupied > 0 && (
          <button
            type="button"
            disabled={!canViewDetails}
            onClick={onToggleDetails}
            className={`flex items-center gap-0.5 text-xs font-semibold transition-all ${
              canViewDetails
                ? "text-primary hover:underline cursor-pointer"
                : "text-on-surface-variant/40 cursor-not-allowed opacity-60 select-none"
            }`}
            title={canViewDetails ? "" : "Identifiez-vous pour voir les détails"}
          >
            <span>{canViewDetails && showAdminsDetails ? "Masquer" : "Voir qui est en ligne"}</span>
            <span className="material-symbols-outlined text-sm select-none">
              {!canViewDetails ? "lock" : showAdminsDetails ? "expand_less" : "expand_more"}
            </span>
          </button>
        )}
      </div>

      {/* Expanded Active Admins Details - Only visible when authorized AND toggled */}
      {canViewDetails && showAdminsDetails && activeSessions.length > 0 && (
        <div className="mt-sm flex flex-col gap-xs border-t border-outline-variant/20 pt-sm animate-fade-in">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Sessions Administrateur Actives :
          </p>
          <div className="flex flex-col gap-xs pt-xs">
            {activeSessions.map((admin, idx) => (
              <div
                key={admin.sessionId || idx}
                className="flex flex-col gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between font-bold text-on-surface">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">person</span>
                    {admin.userName}
                  </span>
                  <span className="text-[10px] font-normal text-on-surface-variant">
                    {formatRelativeTime(admin.loginAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-on-surface-variant font-mono">
                  <span className="material-symbols-outlined text-sm text-emerald-600">call</span>
                  <a href={`tel:${admin.userPhone}`} className="hover:underline">
                    {admin.userPhone}
                  </a>
                </div>

                <div className="flex items-center gap-1.5 rounded-md bg-sky-50/70 border border-sky-200/50 px-2 py-1 text-xs text-sky-900">
                  <span className="material-symbols-outlined text-sm text-sky-600 select-none">
                    {admin.deviceInfo?.deviceType === 'mobile'
                      ? 'smartphone'
                      : admin.deviceInfo?.deviceType === 'tablet'
                      ? 'tablet'
                      : 'desktop_windows'}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-sky-700">Appareil :</span>
                  <span className="font-semibold truncate">{admin.deviceInfo?.label || 'Appareil inconnu'}</span>
                </div>

                <div className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-amber-600">location_on</span>
                  <span className="truncate">{admin.locationInfo?.label || 'Localisation inconnue'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
