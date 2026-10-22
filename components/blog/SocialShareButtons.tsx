"use client";

import { useState } from 'react';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  summary?: string;
}

export default function SocialShareButtons({ url, title, summary }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary || title);

  const shareLinks = [
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      className: 'hover:bg-black hover:text-white',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      className: 'hover:bg-[#1877F2] hover:text-white',
    },
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 0C5.396 0 0 5.395 0 12.031c0 2.115.549 4.179 1.594 6.002L.069 24l6.143-1.611a12.035 12.035 0 005.819 1.488h.005c6.634 0 12.03-5.395 12.03-12.031C24.066 5.395 18.67 0 12.031 0zm0 22.038c-1.798 0-3.56-.484-5.1-1.399l-.366-.217-3.791.994 1.012-3.696-.238-.379a9.988 9.988 0 01-1.534-5.31c0-5.524 4.494-10.018 10.022-10.018 2.677 0 5.195 1.043 7.086 2.935a9.96 9.96 0 012.932 7.087c-.001 5.525-4.496 10.018-10.024 10.018zm5.494-7.5c-.301-.151-1.782-.88-2.058-.98-.276-.1-.477-.151-.678.151-.201.301-.778.98-.954 1.18-.176.201-.352.226-.653.075-.301-.151-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.676-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.527.151-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.633-.929-2.235-.245-.588-.493-.508-.678-.518l-.578-.01c-.201 0-.527.075-.803.377s-1.055 1.03-1.055 2.512c0 1.482 1.08 2.914 1.23 3.115.151.201 2.124 3.244 5.147 4.551.719.311 1.281.497 1.719.636.723.23 1.381.198 1.901.12.58-.088 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.352z" />
        </svg>
      ),
      className: 'hover:bg-[#25D366] hover:text-white',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      className: 'hover:bg-[#0A66C2] hover:text-white',
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4">
      <span className="text-xs font-bold uppercase tracking-wider text-outline mr-1">
        Partager :
      </span>

      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Partager sur ${link.name}`}
          className={`w-9 h-9 rounded-full bg-surface-container-low text-on-surface flex items-center justify-center transition-all duration-200 border border-outline-variant/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${link.className}`}
        >
          {link.icon}
        </a>
      ))}

      {/* Copy Link Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="Copier le lien de l'article"
          className="h-9 px-3.5 rounded-full bg-surface-container-low text-on-surface hover:bg-primary hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 border border-outline-variant/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            link
          </span>
          <span>{copied ? 'Lien copié !' : 'Copier'}</span>
        </button>

        {copied && (
          <span
            role="status"
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-on-background text-surface text-xs font-medium py-1 px-2.5 rounded shadow-lg animate-fade-in"
          >
            Lien copié dans le presse-papier !
          </span>
        )}
      </div>
    </div>
  );
}
