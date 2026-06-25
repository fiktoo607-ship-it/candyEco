"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session) {
      if (session.user.role === "admin") {
        router.replace("/dashboard");
      } else {
        router.replace("/home");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (errorType) {
      if (errorType === "OAuthSignin" || errorType === "OAuthCallback") {
        setErrorMessage("Une erreur s'est produite lors de la connexion avec Google. Veuillez réessayer.");
      } else if (errorType === "OAuthCreateAccount") {
        setErrorMessage("Impossible de créer un compte avec cette adresse e-mail. Veuillez réessayer.");
      } else if (errorType === "Callback") {
        setErrorMessage("La connexion a été refusée. Assurez-vous d'utiliser un compte autorisé.");
      } else {
        setErrorMessage("Une erreur inattendue s'est produite. Veuillez réessayer.");
      }
    }
  }, [errorType]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      await signIn("google");
    } catch (err) {
      setLoading(false);
      setErrorMessage("Une erreur est survenue lors de l'initialisation de la connexion.");
    }
  };

  if (status === "loading" || (status === "authenticated" && !loading)) {
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
              Espace de Connexion
            </h2>
            <p className="mt-xs text-sm text-on-surface-variant">
              Accédez à votre espace membre et à la gestion de la boutique
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-md rounded-xl bg-error-container/40 border border-error/20 p-sm text-center text-sm font-medium text-error flex items-start gap-xs">
              <span className="material-symbols-outlined text-base select-none shrink-0 mt-[2px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-lg flex flex-col gap-md">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="relative inline-flex w-full items-center justify-center gap-sm rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-base font-semibold text-on-surface transition-all duration-200 hover:bg-surface-container hover:shadow-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
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
              <span>{loading ? "Connexion en cours..." : "Se connecter avec Google"}</span>
            </button>

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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-md">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold animate-pulse">Chargement...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
