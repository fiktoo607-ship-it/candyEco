"use client";

import Image from "next/image";
import Toast from "@/components/Toast";
import { useRegister } from "@/lib/hooks/use-register";

export default function RegisterPage() {
  const {
    formData,
    loading,
    showPassword,
    showConfirmPassword,
    errorMessage,
    setErrorMessage,
    successMessage,
    handleInputChange,
    toggleShowPassword,
    toggleShowConfirmPassword,
    handleRegister,
    router,
  } = useRegister();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface text-on-surface">
      {/* Decorative background shapes */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl"></div>

      <div className="w-full max-w-md p-md">
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
              Créer un Compte
            </h2>
            <p className="mt-xs text-sm text-on-surface-variant">
              Inscrivez-vous pour commander et suivre vos achats
            </p>
          </div>

          {successMessage ? (
            <div className="mt-lg text-center animate-fade-in">
              <div className="mb-md flex justify-center">
                <span className="material-symbols-outlined text-5xl text-primary animate-bounce select-none">
                  check_circle
                </span>
              </div>
              <h3 className="text-lg font-bold text-primary">Inscription Réussie</h3>
              <p className="mt-sm text-sm text-on-surface-variant leading-relaxed">
                Votre compte a été créé avec succès pour le numéro <strong>{formData.phone}</strong>.
                Vous pouvez maintenant vous connecter.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-lg inline-flex w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white hover:bg-surface-tint transition-colors shadow-soft"
              >
                Aller à la page de connexion
              </button>
            </div>
          ) : (
            <>
              {/* Error Toast Notification */}
              <Toast
                message={errorMessage || null}
                type="error"
                onClose={() => setErrorMessage("")}
              />

              <form onSubmit={handleRegister} className="mt-lg flex flex-col gap-md">
                {/* Name Field */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Jean Dupont"
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>

                {/* Phone Field */}
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
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>

                {/* Password Field */}
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
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-md pr-lg py-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary focus:bg-surface-container-lowest"
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-sm text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg flex items-center justify-center p-xs"
                    >
                      <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="confirmPassword" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Confirmer le Mot de Passe
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-md pr-lg py-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary focus:bg-surface-container-lowest"
                    />
                    <button
                      type="button"
                      onClick={toggleShowConfirmPassword}
                      aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-sm text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg flex items-center justify-center p-xs"
                    >
                      <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-xs inline-flex w-full items-center justify-center gap-sm rounded-xl bg-primary px-md py-sm text-base font-semibold text-white shadow-soft transition-all hover:bg-surface-tint hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : null}
                  <span>{loading ? "Création du compte..." : "Créer mon compte"}</span>
                </button>

                <div className="mt-xs text-center text-sm text-on-surface-variant">
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Se connecter
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
