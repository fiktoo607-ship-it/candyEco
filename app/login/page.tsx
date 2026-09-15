"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import Toast from "@/components/Toast";
import { getOrCreateAdminDeviceId } from "@/hooks/useAdminHeartbeat";
import { useClientDevice } from "@/hooks/useClientDevice";

interface ActiveAdminInfo {
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

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  return `Il y a ${diffHours} h`;
}

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deviceInfo: clientDevice } = useClientDevice();
  const errorType = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminsDetails, setShowAdminsDetails] = useState(false);
  const [canViewDetails, setCanViewDetails] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveAdminInfo[]>([]);
  const [slotsOccupied, setSlotsOccupied] = useState(0);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  // Fetch active admin sessions info
  const fetchActiveAdminSessions = useCallback(async (creds?: { phone: string; password: string }) => {
    try {
      let res: Response;
      if (creds?.phone && creds?.password) {
        res = await fetch("/api/admin/session/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
          cache: "no-store",
        });
      } else {
        res = await fetch("/api/admin/session/active", { cache: "no-store" });
      }

      if (res.ok) {
        const data = await res.json();
        const sessions = data.activeSessions || [];
        setActiveSessions(sessions);
        setSlotsOccupied(data.slotsOccupied || sessions.length || 0);
        return sessions;
      }
    } catch {
      // Non-blocking background fetch
    }
    return [];
  }, []);

  useEffect(() => {
    fetchActiveAdminSessions();
    const interval = setInterval(fetchActiveAdminSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveAdminSessions]);

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
      if (errorType === "SameAccountAnotherDevice") {
        setErrorMessage("Ce compte administrateur est déjà connecté sur un autre appareil. La connexion simultanée d'un même compte n'est pas autorisée.");
        fetchActiveAdminSessions();
        setCanViewDetails(true);
        setShowAdminsDetails(true);
      } else if (errorType === "AdminSessionActive" || errorType === "MaxAdminsReached") {
        setErrorMessage("La limite de 2 administrateurs connectés simultanément a été atteinte. Veuillez patienter qu'une session se libère.");
        fetchActiveAdminSessions();
        setCanViewDetails(true);
        setShowAdminsDetails(true);
      } else if (errorType === "OAuthSignin" || errorType === "OAuthCallback") {
        setErrorMessage("Une erreur s'est produite lors de la connexion avec Google. Veuillez réessayer.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      } else if (errorType === "OAuthCreateAccount") {
        setErrorMessage("Impossible de créer un compte avec cette adresse e-mail. Veuillez réessayer.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      } else if (errorType === "Callback") {
        setErrorMessage("La connexion a été refusée. Assurez-vous d'utiliser un compte autorisé.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      } else if (errorType === "EmailNotVerified") {
        setErrorMessage("Votre adresse e-mail n'a pas encore été vérifiée. Veuillez vérifier votre boîte de réception.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      } else if (errorType === "OAuthAccountNotLinked") {
        setErrorMessage("Cette adresse e-mail est déjà associée à un compte existant. Veuillez vous connecter avec votre mot de passe.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      } else if (errorType === "CredentialsSignin") {
        setErrorMessage("Numéro de téléphone ou mot de passe incorrect.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      } else {
        setErrorMessage("Une erreur inattendue s'est produite. Veuillez réessayer.");
        setCanViewDetails(false);
        setShowAdminsDetails(false);
      }
    }
  }, [errorType, fetchActiveAdminSessions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setShowAdminsDetails(false);
    setCanViewDetails(false);
    setActiveSessions([]);
    setLoading(true);

    const currentPhone = formData.phone;
    const currentPassword = formData.password;

    try {
      const deviceId = getOrCreateAdminDeviceId();
      const result = await signIn("credentials", {
        phone: currentPhone,
        password: currentPassword,
        deviceId,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "SameAccountAnotherDevice") {
          await fetchActiveAdminSessions({ phone: currentPhone, password: currentPassword });
          setErrorMessage("Ce compte administrateur est déjà connecté sur un autre appareil. La connexion simultanée d'un même compte n'est pas autorisée.");
          setCanViewDetails(true);
          setShowAdminsDetails(true);
        } else if (result.error === "AdminSessionActive" || result.error === "MaxAdminsReached") {
          await fetchActiveAdminSessions({ phone: currentPhone, password: currentPassword });
          setErrorMessage("La limite de 2 administrateurs connectés simultanément est atteinte. Veuillez patienter qu'une session se libère.");
          setCanViewDetails(true);
          setShowAdminsDetails(true);
        } else if (result.error === "TooManyRequests") {
          setErrorMessage("Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.");
          setCanViewDetails(false);
          setShowAdminsDetails(false);
        } else {
          // Normal error when credentials are not valid (wrong phone or password)
          setErrorMessage("Numéro de téléphone ou mot de passe incorrect.");
          setCanViewDetails(false);
          setShowAdminsDetails(false);
          setActiveSessions([]);
        }
        setLoading(false);
      } else if (result?.ok) {
        // Direct login succeeded
        router.refresh();
      }
    } catch (err) {
      setErrorMessage("Une erreur réseau s'est produite. Veuillez réessayer.");
      setCanViewDetails(false);
      setShowAdminsDetails(false);
      setActiveSessions([]);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage("");
      await signIn("google");
    } catch (err) {
      setGoogleLoading(false);
      setErrorMessage("Une erreur est survenue lors de l'initialisation de la connexion.");
    }
  };

  if (status === "loading" || (status === "authenticated" && !loading && !googleLoading)) {
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
                  onClick={() => {
                    if (canViewDetails) {
                      setShowAdminsDetails((prev) => !prev);
                    }
                  }}
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
                          {admin.deviceInfo?.deviceType === 'mobile' ? 'smartphone' : admin.deviceInfo?.deviceType === 'tablet' ? 'tablet' : 'desktop_windows'}
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

          {/* Error Toast Notification */}
          <div className="mt-sm">
            <Toast
              message={errorMessage || null}
              type="error"
              onClose={() => setErrorMessage("")}
            />
          </div>

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
                  onClick={() => setShowPassword(!showPassword)}
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

          {/* OAuth Buttons */}
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
