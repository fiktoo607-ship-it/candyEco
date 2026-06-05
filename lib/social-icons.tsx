type SocialLabel = 'Facebook' | 'Instagram' | 'Pinterest' | 'TikTok';

interface SocialIconProps {
  label: SocialLabel;
  className?: string;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8.5h2.5V5H14c-2.2 0-4 1.8-4 4v2H7v3.5h3V19h4v-4.5h2.6L17 11H14v-2c0-.3.2-.5.5-.5Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="16.8" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12.2 7.8c-1.9 0-3.2 1.4-3.2 3.1 0 1.1.5 2 1.4 2.4l-.6 2.5c-.1.4.2.5.5.3 1-.7 1.6-1.6 1.9-2.9h.5c2.2 0 3.7-1.5 3.7-3.7 0-1.9-1.6-3.7-4.2-3.7-2.9 0-4.7 2-4.7 4.1 0 1.2.5 2.1 1.3 2.8" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function SocialIcon({ label, className }: SocialIconProps) {
  switch (label) {
    case 'Facebook':
      return <FacebookIcon className={className} />;
    case 'Instagram':
      return <InstagramIcon className={className} />;
    case 'Pinterest':
      return <PinterestIcon className={className} />;
    case 'TikTok':
      return <TikTokIcon className={className} />;
  }
}
