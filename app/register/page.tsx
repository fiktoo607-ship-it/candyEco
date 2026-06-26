"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
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

    const { name, email, password, confirmPassword } = formData;

    if (!name || name.trim() === "") {
      setErrorMessage("Veuillez saisir votre nom.");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
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
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'inscription.");
        setLoading(false);
      } else {
        setSuccessMessage(data.message || "Inscription réussie ! Veuillez vérifier vos e-mails.");
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
                  mark_email_read
                </span>
              </div>
              <h3 className="text-lg font-bold text-primary">Vérification Requise</h3>
              <p className="mt-sm text-sm text-on-surface-variant leading-relaxed">
                Un e-mail de confirmation a été envoyé à <strong>{formData.email}</strong>.
                Veuillez cliquer sur le lien dans l'e-mail pour activer votre compte.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-lg inline-flex w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white hover:bg-surface-tint transition-colors shadow-soft"
              >
                Aller à la page de connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="mt-lg flex flex-col gap-md">
              {errorMessage && (
                <div className="rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-sm font-medium text-error flex items-start gap-xs">
                  <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

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

              {/* Email Field */}
              <div className="flex flex-col gap-xs">
                <label htmlFor="email" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Adresse E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="jean.dupont@example.com"
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-xs">
                <label htmlFor="password" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Mot de Passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
                />
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-xs">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Confirmer le Mot de Passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm outline-none transition-all focus:border-primary focus:bg-surface-container-lowest"
                />
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
          )}
        </div>
      </div>
    </div>
  );
}
