import dictionary from '@/lib/copy-dictionary.json';

export default function ValuesSection() {
  return (
    <section className="mt-lg md:mt-xl rounded-2xl bg-surface-container-low p-6 md:p-lg">
      <h2 className="text-center font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary leading-tight">{dictionary.about.values.title}</h2>
      <div className="mt-md md:mt-lg grid gap-md md:grid-cols-3">
        {dictionary.about.values.items.map((value) => (
          <article key={value.title} className="rounded-2xl bg-surface-container-lowest p-6 md:p-lg text-center shadow-soft">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface leading-tight">{value.title}</h3>
            <p className="mt-sm text-base leading-8 text-on-surface-variant">{value.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
