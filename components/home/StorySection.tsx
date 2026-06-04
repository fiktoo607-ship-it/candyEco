export default function StorySection() {
  return (
    <section className="mx-auto grid max-w-container-max gap-lg px-gutter pb-xl md:grid-cols-2 md:items-center">
      <div>
        <h2 className="font-display text-4xl font-bold text-on-surface">مصنوع باليد، لا بالسرعة</h2>
        <p className="mt-md text-lg leading-8 text-on-surface-variant">نحن نخبز بعقلية الحِرفة: عجين بطيء، زبدة جيدة، ومواعيد نضج دقيقة. النتيجة هي حلويات تبدو يومية، لكنها تحمل طبقة فاخرة في كل قضمة.</p>
      </div>
      <div className="overflow-hidden rounded-2xl shadow-soft">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ9D8JLa_bfz2-LqILaPS5Y5BNwRA_3_bfuzgyv-_AiSHUdnRMTf5_AZb6INTxhlP88O8s1X6XR4AHvNDEXK2EDRRgpY4cna0MCbdHkCPv5-jz00MwRuChHhuklDPaHhX_dCvMy5Dv9urTEaOek3gFOHeGFvTCbs0nYdUqQJqghQfUlyn25b0pdgqrw3irttdyHjTFncU2Z5NssW_4gRAVVey6EbOYqQdOcZJoP5395MAXo8JM1qL2SqWTp83OEnG2GDgZVOXJyyo"
          alt="الخبز الحرفي"
          className="h-[420px] w-full object-cover"
        />
      </div>
    </section>
  );
}
