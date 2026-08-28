"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Toast from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const { name, phone, password, confirmPassword } = formData;

    if (!name || name.trim() === "") {
      setErrorMessage("Veuillez saisir votre nom.");
      return;
    }
    if (!phone || phone.trim() === "") {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide.");
      return;
    }
    const phoneRegex = /^[+0-9\s-]{8,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide.");
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'inscription.");
        setLoading(false);
      } else {
        setSuccessMessage(data.message || "Inscription réussie ! Vous pouvez maintenant vous connecter.");
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage("Une erreur réseau s'est produite. Veuillez réessayer.");
      setLoading(false);
    }
  };

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
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
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
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
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
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-md pr-lg py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none flex items-center justify-center p-xs"
                  >
                    <span className="material-symbols-outlined text-lg select-none">
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
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-md pr-lg py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none flex items-center justify-center p-xs"
                  >
                    <span className="material-symbols-outlined text-lg select-none">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-xs inline-flex w-full items-center justify-center gap-sm rounded-xl bg-primary px-md py-sm text-base font-semibold text-white shadow-soft transition-all hover:bg-surface-tint hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
