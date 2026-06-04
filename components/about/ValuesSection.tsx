import { bakeryValues } from '@/lib/site-data';

export default function ValuesSection() {
  return (
    <section className="mt-xl rounded-2xl bg-surface-container-low p-lg">
      <h2 className="text-center font-display text-4xl font-bold text-primary">Des Ingrédients Sans Compromis</h2>
      <div className="mt-lg grid gap-md md:grid-cols-3">
        {bakeryValues.map((value) => (
          <article key={value.title} className="rounded-2xl bg-surface-container-lowest p-lg text-center shadow-soft">
            <h3 className="font-display text-2xl font-bold text-on-surface">{value.title}</h3>
            <p className="mt-sm text-base leading-8 text-on-surface-variant">{value.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
