"use client";

import React, { useState } from 'react';

interface ContactFormProps {
  onSuccess?: () => void;
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Veuillez saisir votre nom.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Veuillez saisir votre adresse e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Veuillez saisir une adresse e-mail valide.';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Veuillez rédiger un message.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        if (onSuccess) onSuccess();
      }, 500);
    }
  };

  return (
    <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 md:p-lg shadow-soft">
      <h2 className="font-display text-2xl font-bold text-on-surface mb-md">
        Envoyez-nous un message
      </h2>

      {isSubmitted ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-md text-emerald-800 text-sm flex items-center gap-sm">
          <span className="material-symbols-outlined text-emerald-600 text-2xl" aria-hidden="true">
            check_circle
          </span>
          <div>
            <p className="font-bold">Message envoyé avec succès !</p>
            <p className="text-xs mt-0.5">Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-sm">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-bold text-on-surface-variant mb-xs">
              Nom complet
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              aria-invalid={errors.name ? "true" : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
                errors.name ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-error mt-xs">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-sm font-bold text-on-surface-variant mb-xs">
              Adresse e-mail
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              aria-invalid={errors.email ? "true" : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
                errors.email ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-error mt-xs">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact-phone" className="block text-sm font-bold text-on-surface-variant mb-xs">
              Numéro de téléphone (Optionnel)
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              aria-invalid={errors.phone ? "true" : undefined}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
                errors.phone ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.phone && (
              <p id="phone-error" className="text-xs text-error mt-xs">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-bold text-on-surface-variant mb-xs">
              Votre message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              aria-invalid={errors.message ? "true" : undefined}
              aria-describedby={errors.message ? "message-error" : undefined}
              className={`w-full rounded-lg border bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary ${
                errors.message ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.message && (
              <p id="message-error" className="text-xs text-error mt-xs">{errors.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-sm text-base font-bold text-white shadow-soft hover:bg-surface-tint transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
        </form>
      )}
    </div>
  );
}

export { ContactForm };
