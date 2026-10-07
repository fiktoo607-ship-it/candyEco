"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  PHONE_REGEX,
} from "@/lib/validations/auth";

export interface RegisterFormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
}


export function useRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
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

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

  const validateForm = (): string | null => {
    const { name, phone, password, confirmPassword } = formData;

    if (!name || name.trim() === "") {
      return "Veuillez saisir votre nom.";
    }
    if (!phone || phone.trim() === "") {
      return "Veuillez saisir un numéro de téléphone valide.";
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      return "Veuillez saisir un numéro de téléphone valide.";
    }
    if (!password || password.length < 8) {
      return "Le mot de passe doit comporter au moins 8 caractères.";
    }
    if (password.length > 128) {
      return "Le mot de passe ne doit pas dépasser 128 caractères.";
    }
    if (password !== confirmPassword) {
      return "Les mots de passe ne correspondent pas.";
    }

    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const { name, phone, password } = formData;

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
      } else {
        setSuccessMessage(data.message || "Inscription réussie ! Vous pouvez maintenant vous connecter.");
      }
    } catch {
      setErrorMessage("Une erreur réseau s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
