import { getDictionaryWithDbOverrides } from '@/lib/config';

export default async function BakeryVisitCard() {
  const dictionary = await getDictionaryWithDbOverrides();
  const visit = dictionary.contact?.visit || {};
  const addressParts = (visit.address_value || '').split(', ');
  const hoursParts = (visit.hours_value || '').split(' | ');

  return (
    <div className="space-y-lg lg:col-span-5">
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 md:p-lg shadow-soft">
        <h2 className="font-display text-3xl font-bold text-on-surface">
          {visit.title}
        </h2>
        <div className="mt-md space-y-md text-base leading-8 text-on-surface-variant">
          <div>
            <p className="font-semibold text-on-surface">
              {visit.hours}
            </p>
            <p>
              {hoursParts.map((part: string, i: number) => (
                <span key={i}>
                  {part}
                  {i < hoursParts.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">
              {visit.phone}
            </p>
            <p>{visit.phone_value}</p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">
              Adresse Email
            </p>
            <p>{visit.email_value}</p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">
              {visit.address}
            </p>
            <p>
              {addressParts.map((part: string, i: number) => (
                <span key={i}>
                  {part}
                  {i < addressParts.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
