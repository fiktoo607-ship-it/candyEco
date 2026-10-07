import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const PHONE_REGEX = /^[+0-9\s-]{8,20}$/;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(100, "Le nom est trop long."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Un numéro de téléphone valide est obligatoire."),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`)
    .max(MAX_PASSWORD_LENGTH, `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères.`),
});

export const loginCredentialsSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire."),
  password: z
    .string()
    .min(1, "Le mot de passe est obligatoire.")
    .max(MAX_PASSWORD_LENGTH, `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères.`),
});
