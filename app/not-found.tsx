import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-container-max flex-1 flex-col items-center justify-center px-gutter py-2xl text-center">
        <div className="max-w-md space-y-md">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">
              search_off
            </span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            404
          </h1>

          <h2 className="font-display text-2xl font-bold text-on-surface">
            Page non trouvée
          </h2>

          <p className="text-base leading-relaxed text-on-surface-variant">
            Oups ! La page que vous recherchez semble introuvable, a été déplacée ou n'existe plus.
          </p>

          <div className="flex flex-col gap-sm pt-sm sm:flex-row sm:justify-center">
            <Link
              href="/home"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-lg py-sm text-base font-bold text-white shadow-soft transition-all hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Retour à l&apos;accueil
            </Link>

            <Link
              href="/our-product"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low px-lg py-sm text-base font-bold text-on-surface transition-all hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Nos créations
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
