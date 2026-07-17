import React from 'react';

interface ShopStatusSectionProps {
  register: any;
  watch: any;
  setValue: any;
}

export function ShopStatusSection({ register, watch, setValue }: ShopStatusSectionProps) {
  const isEnabled = watch('store_enabled');

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md transition-all">
      <div className="flex items-start gap-sm">
        <span
          className={`material-symbols-outlined text-3xl ${isEnabled ? "text-emerald-500" : "text-rose-500 animate-pulse"}`}
        >
          {isEnabled ? "store" : "storefront"}
        </span>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-on-surface">
            Statut de la Boutique
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-[2px]">
            Activer ou désactiver temporairement les commandes des clients.
          </p>
        </div>
      </div>

      <div className="space-y-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm border-t border-outline-variant/10 pt-md">
          <label className="text-sm font-bold text-on-surface-variant flex items-center gap-xs">
            <span className="material-symbols-outlined text-lg">
              settings_power
            </span>
            Prise de commande :
          </label>
          <div className="flex items-center gap-sm w-full sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setValue("store_enabled", true, { shouldDirty: true })
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-xs rounded-xl px-md py-xs text-sm font-semibold border transition-all ${
                isEnabled === true
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-soft font-bold"
                  : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              Ouvert
            </button>
            <button
              type="button"
              onClick={() =>
                setValue("store_enabled", false, { shouldDirty: true })
              }
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-xs rounded-xl px-md py-xs text-sm font-semibold border transition-all ${
                isEnabled === false
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 shadow-soft font-bold"
                  : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              Fermé
            </button>
          </div>
        </div>

        {isEnabled === false && (
          <div className="flex flex-col gap-xs animate-fade-in border border-rose-500/20 bg-rose-500/[0.02] p-md rounded-xl space-y-xs">
            <div className="flex items-center gap-xs text-rose-600">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Alerte Boutique Fermée
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Saisissez le message d'indisponibilité temporaire qui sera visible
              par vos clients :
            </p>
            <textarea
              rows={2}
              {...register("store_message", { required: isEnabled === false })}
              placeholder="Nous sommes fermés pour les vacances d'été. Réouverture le 10 Juillet !"
              className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none w-full transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
