import dictionary from '@/lib/copy-dictionary.json';

export default function ContactHero() {
  return (
    <section className="text-center md:text-left">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{dictionary.contact.hero.tagline}</p>
      <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">{dictionary.contact.hero.title}</h1>
      <p className="mx-auto mt-md max-w-3xl text-lg leading-8 text-on-surface-variant md:mx-0">{dictionary.contact.hero.description}</p>
    </section>
  );
}
