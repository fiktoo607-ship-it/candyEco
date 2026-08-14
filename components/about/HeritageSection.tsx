interface HeritageSectionProps {
  title: string;
  desc1: string;
  desc2: string;
  image?: string;
}

const DEFAULT_HERITAGE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ9D8JLa_bfz2-LqILaPS5Y5BNwRA_3_bfuzgyv-_AiSHUdnRMTf5_AZb6INTxhlP88O8s1X6XR4AHvNDEXK2EDRRgpY4cna0MCbdHkCPv5-jz00MwRuChHhuklDPaHhX_dCvMy5Dv9urTEaOek3gFOHeGFvTCbs0nYdUqQJqghQfUlyn25b0pdgqrw3irttdyHjTFncU2Z5NssW_4gRAVVey6EbOYqQdOcZJoP5395MAXo8JM1qL2SqWTp83OEnG2GDgZVOXJyyo";

export default function HeritageSection({ title, desc1, desc2, image }: HeritageSectionProps) {
  return (
    <section className="mt-lg md:mt-xl grid gap-md md:gap-xl md:grid-cols-2 md:items-center">
      <div className="overflow-hidden rounded-2xl shadow-soft">
        <img
          src={image || DEFAULT_HERITAGE_IMAGE}
          alt="Boulanger"
          className="h-[300px] sm:h-[400px] md:h-[520px] w-full object-cover"
        />
      </div>
      <div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-secondary leading-tight">{title}</h2>
        <p className="mt-md text-lg leading-8 text-on-surface-variant">{desc1}</p>
        <p className="mt-md text-base leading-8 text-on-surface-variant">{desc2}</p>
      </div>
    </section>
  );
}
