import Link from 'next/link';
import { contactLinks } from '@/lib/site-data';

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant/20 bg-surface-container-low py-xl">
      <div className="mx-auto flex max-w-container-max flex-col gap-lg px-gutter md:flex-row md:items-start md:justify-between md:gap-0">
        <div className="flex flex-col gap-sm">
          <span className="font-display text-2xl font-bold text-primary">Boulangerie Artisanale</span>
          <p className="text-base text-on-surface-variant">© 2024 Boulangerie Artisanale. Fait main avec amour.</p>
        </div>

        <div className="flex flex-col gap-sm">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Suivez-nous</span>
          <div className="flex flex-col gap-xs">
            {contactLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-base text-on-surface-variant transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-base text-on-surface-variant">Horaires : Lundi - Samedi 7h00 - 18h00</p>
        </div>
      </div>
    </footer>
  );
}