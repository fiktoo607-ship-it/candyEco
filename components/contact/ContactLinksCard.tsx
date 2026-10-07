import Link from 'next/link';
import { SocialIcon, getSocialLink } from '@/lib/social-icons';
import { getDictionaryWithDbOverrides, getAllSiteConfigs } from '@/lib/config';

export default async function ContactLinksCard() {
  const dictionary = await getDictionaryWithDbOverrides();
  const configs = await getAllSiteConfigs();
  const social = dictionary.contact?.social || {};

  const rawInstagram = configs.contact_social_instagram || social.instagram;
  const rawTiktok = configs.contact_social_tiktok || social.tiktok;

  const socialLinks = [
    {
      label: 'Instagram',
      href: getSocialLink('Instagram', rawInstagram),
      username: configs.contact_social_instagram_user || social.instagram_user || 'lesdelices.d.eva',
    },
    {
      label: 'TikTok',
      href: getSocialLink('TikTok', rawTiktok),
      username: configs.contact_social_tiktok_user || social.tiktok_user || 'les.delices.d.eva',
    },
  ];

  return (
    <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 md:p-lg shadow-soft">
      <h2 className="font-display text-3xl font-bold text-on-surface">{dictionary.contact?.links?.title || "Suivez-nous"}</h2>
      <div className="mt-md space-y-sm">
        {socialLinks.map((link) => (
          <Link key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-sm rounded-xl border border-outline-variant/20 px-md py-sm text-base text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">
              <SocialIcon label={link.label as 'Facebook' | 'Instagram' | 'Pinterest' | 'TikTok'} className="h-5 w-5" />
            </span>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-on-surface">{link.label}</span>
              {link.username && <span className="text-xs text-on-surface-variant/70">@{link.username}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
