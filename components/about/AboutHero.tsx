interface AboutHeroProps {
  title: string;
  description: string;
}

export default function AboutHero({ title, description }: AboutHeroProps) {
  return (
    <section className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Notre Histoire</p>
      <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">{title}</h1>
      <p className="mx-auto mt-md max-w-3xl text-lg leading-8 text-on-surface-variant">{description}</p>
    </section>
  );
}
