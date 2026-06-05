import Link from 'next/link';
import { SocialIcon } from '@/lib/social-icons';
import { getDictionary } from '@/lib/config';

export default async function ContactLinksCard() {
  const dictionary = getDictionary();
  const social = dictionary.contact?.social || {};

  const socialLinks = [
    { label: 'Instagram', href: social.instagram || '', username: social.instagram_user || '' },
    { label: 'TikTok', href: social.tiktok || '', username: social.tiktok_user || '' }
  ];

  return (
    <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-lg shadow-soft">
      <h2 className="font-display text-3xl font-bold text-on-surface">{dictionary.contact.links.title}</h2>
      <div className="mt-md space-y-sm">
        {socialLinks.map((link) => (
          <Link key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-sm rounded-xl border border-outline-variant/20 px-md py-sm text-base text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">
              <SocialIcon label={link.label as 'Facebook' | 'Instagram' | 'Pinterest' | 'TikTok'} className="h-5 w-5" />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-on-surface">{link.label}</span>
              {link.username && <span className="text-xs text-on-surface-variant/70">@{link.username}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
