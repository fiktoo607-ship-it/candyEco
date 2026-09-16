"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getOrCreateAdminDeviceId, useAdminSession } from "@/hooks/useAdminSession";
import { ActiveAdminInfo } from "@/components/auth/ActiveAdminsWidget";

export function useLogin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deviceInfo: clientDevice } = useAdminSession();
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
      let cachedModel: string | null = null;
      if (typeof window !== "undefined") {
        cachedModel = localStorage.getItem("admin_device_model");
      }

      let res: Response;
      if (creds?.phone && creds?.password) {
        res = await fetch("/api/admin/session/active", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cachedModel ? { "x-device-name": cachedModel } : {}),
          },
          body: JSON.stringify({ ...creds, deviceName: cachedModel }),
          cache: "no-store",
        });
      } else {
        res = await fetch("/api/admin/session/active", {
          headers: cachedModel ? { "x-device-name": cachedModel } : undefined,
          cache: "no-store",
        });
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

  // Poll for active admin sessions
  useEffect(() => {
    fetchActiveAdminSessions();
    const interval = setInterval(fetchActiveAdminSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveAdminSessions]);

  // Handle redirects on authenticated session
  useEffect(() => {
    if (status === "authenticated" && session) {
      if (session.user.role === "admin") {
        router.replace("/dashboard");
      } else {
        router.replace("/home");
      }
    }
  }, [status, session, router]);

  // Handle error search params
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

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowAdminsDetails = () => {
    if (canViewDetails) {
      setShowAdminsDetails((prev) => !prev);
    }
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
      let deviceModel: string | undefined = clientDevice?.model;
      if (!deviceModel && typeof window !== "undefined") {
        const stored = localStorage.getItem("admin_device_model");
        if (stored) deviceModel = stored;
      }

      const result = await signIn("credentials", {
        phone: currentPhone,
        password: currentPassword,
        deviceId,
        deviceName: deviceModel || clientDevice?.label || undefined,
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
          setErrorMessage("Numéro de téléphone ou mot de passe incorrect.");
          setCanViewDetails(false);
          setShowAdminsDetails(false);
          setActiveSessions([]);
        }
        setLoading(false);
      } else if (result?.ok) {
        router.refresh();
      }
    } catch {
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
    } catch {
      setGoogleLoading(false);
      setErrorMessage("Une erreur est survenue lors de l'initialisation de la connexion.");
    }
  };

  const isInitialLoading = status === "loading" || (status === "authenticated" && !loading && !googleLoading);

  return {
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
  };
}
