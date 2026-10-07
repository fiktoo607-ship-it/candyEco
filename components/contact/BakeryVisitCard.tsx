import { getDictionaryWithDbOverrides, getAllSiteConfigs } from '@/lib/config';

export default async function BakeryVisitCard() {
  const dictionary = await getDictionaryWithDbOverrides();
  const configs = await getAllSiteConfigs();
  const visit = dictionary.contact?.visit || {};

  const rawAddress = configs.contact_address || visit.address_value || '15 Rue de la Paix, 75002 Paris, France';
  // Fallback to official French store address if leftover New York placeholder is detected
  const address = rawAddress.includes('New York') ? '15 Rue de la Paix, 75002 Paris, France' : rawAddress;

  const rawEmail = configs.contact_email || visit.email_value || 'contact@lesdelicesdeva.fr';
  // Fallback to official email if placeholder template email is detected
  const email = rawEmail === 'contact@boulangerie-artisanale.fr' ? 'contact@lesdelicesdeva.fr' : rawEmail;

  const phone = configs.contact_phone || visit.phone_value || '+33 6 95 04 98 33';
  const hours = configs.contact_hours || visit.hours_value || 'Lundi - Samedi : 7h00 - 18h00 | Dimanche : Fermé';

  const addressParts = address.split(', ');
  const hoursParts = hours.split(' | ');

  return (
    <div className="space-y-lg lg:col-span-5">
      <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 md:p-lg shadow-soft">
        <h2 className="font-display text-3xl font-bold text-on-surface">
          {visit.title || "Notre Boutique"}
        </h2>
        <div className="mt-md space-y-md text-base leading-8 text-on-surface-variant">
          <div>
            <p className="font-semibold text-on-surface">
              {visit.hours || "Horaires"}
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
              {visit.phone || "Téléphone"}
            </p>
            <p>{phone}</p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">
              Adresse Email
            </p>
            <p>{email}</p>
          </div>
          <div>
            <p className="font-semibold text-on-surface">
              {visit.address || "Adresse"}
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
