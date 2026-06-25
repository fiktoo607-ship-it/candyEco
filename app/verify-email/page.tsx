"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Vérification de votre adresse e-mail en cours...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide ou manquant.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Votre adresse e-mail a été validée.");
        } else {
          setStatus("error");
          setMessage(data.error || "La validation de l'e-mail a échoué.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Une erreur réseau s'est produite. Veuillez réessayer.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface text-on-surface">
      {/* Decorative background shapes */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl"></div>

      <div className="w-full max-w-md p-md">
        <div className="animate-fade-in rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/80 p-lg shadow-soft backdrop-blur-md text-center">
          {/* Brand Logo */}
          <div className="mb-md flex justify-center">
            <Image
              src="/logo-title.png"
              alt="Délices d'Eva Logo"
              width={198}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          {status === "loading" && (
            <div className="flex flex-col items-center gap-md my-md">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm font-semibold">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="animate-fade-in my-md">
              <span className="material-symbols-outlined text-5xl text-primary animate-pulse select-none mb-sm block">
                verified
              </span>
              <h3 className="text-xl font-bold text-primary">Compte Activé !</h3>
              <p className="mt-sm text-sm text-on-surface-variant leading-relaxed">
                {message}
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-lg inline-flex w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white hover:bg-surface-tint transition-colors shadow-soft"
              >
                Se connecter
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="animate-fade-in my-md">
              <span className="material-symbols-outlined text-5xl text-error select-none mb-sm block">
                cancel
              </span>
              <h3 className="text-xl font-bold text-error">Erreur d'Activation</h3>
              <p className="mt-sm text-sm text-on-surface-variant leading-relaxed">
                {message}
              </p>
              <div className="mt-lg flex flex-col gap-sm">
                <button
                  onClick={() => router.push("/register")}
                  className="inline-flex w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white hover:bg-surface-tint transition-colors shadow-soft"
                >
                  S'inscrire à nouveau
                </button>
                <button
                  onClick={() => router.push("/home")}
                  className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-md">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
