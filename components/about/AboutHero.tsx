import dictionary from '@/lib/copy-dictionary.json';

export default function AboutHero() {
  return (
    <section className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{dictionary.about.hero.tagline}</p>
      <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">{dictionary.about.hero.title}</h1>
      <p className="mx-auto mt-md max-w-3xl text-lg leading-8 text-on-surface-variant">{dictionary.about.hero.description}</p>
    </section>
  );
}
