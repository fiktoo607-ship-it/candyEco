import Link from 'next/link';
import { contactLinks } from '@/lib/site-data';

export default function ContactLinksCard() {
  return (
    <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-lg shadow-soft">
      <h2 className="font-display text-3xl font-bold text-on-surface">تواصل معنا</h2>
      <div className="mt-md space-y-sm">
        {contactLinks.map((link) => (
          <Link key={link.label} href={link.href} className="flex items-center gap-sm rounded-xl border border-outline-variant/20 px-md py-sm text-base text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">•</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
