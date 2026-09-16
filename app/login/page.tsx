"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import ActiveAdminsWidget from "@/components/auth/ActiveAdminsWidget";
import { useLogin } from "@/lib/hooks/use-login";

function LoginContent() {
  const router = useRouter();
  const {
    formData,
    handleInputChange,
    showPassword,
    toggleShowPassword,
    loading,
    googleLoading,
    errorMessage,
    setErrorMessage,
    isInitialLoading,
    clientDevice,
    slotsOccupied,
    canViewDetails,
    showAdminsDetails,
    toggleShowAdminsDetails,
    activeSessions,
    handleCredentialsLogin,
    handleGoogleLogin,
  } = useLogin();

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-md">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface text-on-surface py-lg px-md">
      {/* Decorative background shapes */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl"></div>

      <div className="w-full max-w-md">
        <div className="animate-fade-in rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/80 p-lg shadow-soft backdrop-blur-md">
          {/* Brand Logo & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-sm flex items-center justify-center">
              <Image
                src="/logo-title.png"
                alt="Délices d'Eva Logo"
                width={198}
                height={40}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-primary">
              Espace de Connexion
            </h2>
            <p className="mt-xs text-sm text-on-surface-variant">
              Accédez à votre espace membre et à la gestion de la boutique
            </p>
          </div>

          {/* Active Admin Indicator & Transparency Widget */}
          <ActiveAdminsWidget
            slotsOccupied={slotsOccupied}
            canViewDetails={canViewDetails}
            showAdminsDetails={showAdminsDetails}
            activeSessions={activeSessions}
            onToggleDetails={toggleShowAdminsDetails}
          />

          {/* Error Toast Notification */}
          <Toast
            message={errorMessage || null}
            type="error"
            onClose={() => setErrorMessage("")}
          />

          {/* Current Device Detection Banner */}
          {clientDevice && (
            <div className="mt-sm flex items-center gap-2.5 rounded-xl bg-sky-50/70 border border-sky-200/60 p-2.5 text-xs text-sky-900 shadow-2xs">
              <span className="material-symbols-outlined text-base text-sky-600 flex-shrink-0 select-none">
                {clientDevice.deviceType === "mobile"
                  ? "smartphone"
                  : clientDevice.deviceType === "tablet"
                  ? "tablet"
                  : "desktop_windows"}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Votre appareil :</span>
                <span className="font-semibold">{clientDevice.label}</span>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsLogin} className="mt-md flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="phone" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Numéro de Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+33 6 12 34 56 78"
                className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="password" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Mot de Passe
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-md pr-lg py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none flex items-center justify-center p-xs"
                >
                  <span className="material-symbols-outlined text-lg select-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="inline-flex w-full items-center justify-center gap-sm rounded-xl bg-primary px-md py-sm text-base font-semibold text-white shadow-soft transition-all hover:bg-surface-tint active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : null}
              <span>{loading ? "Connexion..." : "Se connecter"}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-md flex items-center justify-center">
            <div className="absolute w-full border-t border-outline-variant/30"></div>
            <span className="relative bg-surface-container-lowest px-sm text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Ou continuer avec
            </span>
          </div>

          {/* OAuth Buttons & Navigation */}
          <div className="flex flex-col gap-md">
            <button
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="relative inline-flex w-full items-center justify-center gap-sm rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-base font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container hover:shadow-soft active:scale-[0.98] disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              ) : (
                <svg className="h-5 w-5 select-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span>{googleLoading ? "Connexion en cours..." : "Google"}</span>
            </button>

            <div className="text-center text-sm text-on-surface-variant">
              Nouveau membre ?{" "}
              <button
                onClick={() => router.push("/register")}
                className="font-semibold text-primary hover:underline"
              >
                Créer un compte
              </button>
            </div>

            <button
              onClick={() => router.push("/home")}
              className="inline-flex w-full items-center justify-center gap-xs rounded-xl px-md py-sm text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base select-none">arrow_back</span>
              <span>Retour à l'accueil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
          <div className="flex flex-col items-center gap-md">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-semibold animate-pulse">Chargement...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
