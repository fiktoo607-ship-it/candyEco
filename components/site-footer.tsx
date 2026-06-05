import Link from 'next/link';
import { THEME_CONFIG } from '@/lib/theme';
import { SocialIcon } from '@/lib/social-icons';
import dictionary from '@/lib/copy-dictionary.json';

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-low py-xl">
      <div className="mx-auto flex max-w-container-max flex-col gap-lg px-gutter md:flex-row md:items-start md:justify-between md:gap-0">
        <div className="flex flex-col gap-sm">
          <span className="font-display text-2xl font-bold text-primary">{THEME_CONFIG.brand.logoText}</span>
          <p className="text-base text-on-surface-variant">
            © {new Date().getFullYear()} {THEME_CONFIG.brand.name}. {dictionary.footer.handmade}
          </p>
        </div>

        <div className="flex flex-col gap-sm">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">{dictionary.footer.followUs}</span>
          <div className="flex flex-col gap-xs">
            {THEME_CONFIG.brand.contact.socialLinks.map((link) => (
              <Link key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-base text-on-surface-variant transition-colors hover:text-primary">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-primary">
                  <SocialIcon label={link.label as 'Facebook' | 'Instagram' | 'Pinterest' | 'TikTok'} className="h-4 w-4" />
                </span>
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-base text-on-surface-variant">{dictionary.footer.hours} {THEME_CONFIG.brand.contact.hours}</p>
        </div>
      </div>
    </footer>
  );
}