export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  label: string;
}

export interface LocationInfo {
  ip: string;
  city?: string;
  country?: string;
  label: string;
}

/**
 * Parses user-agent header into structured device information.
 */
export function parseDeviceInfo(userAgent: string | null | undefined): DeviceInfo {
  if (!userAgent) {
    return {
      browser: 'Inconnu',
      os: 'Inconnu',
      deviceType: 'desktop',
      label: 'Appareil inconnu',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect OS
  let os = 'Inconnu';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) {
    os = ua.includes('iphone') ? 'iOS (iPhone)' : ua.includes('ipad') ? 'iPadOS' : 'macOS';
  } else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';

  // Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
    deviceType = 'tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = 'mobile';
  }

  // Detect Browser
  let browser = 'Navigateur inconnu';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';

  const typeLabel = deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablette' : 'PC';
  const label = `${browser} sur ${os} (${typeLabel})`;

  return {
    browser,
    os,
    deviceType,
    label,
  };
}

/**
 * Extracts IP and location labels from incoming HTTP headers.
 */
export function extractLocationInfo(
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): LocationInfo {
  if (!headers) {
    return {
      ip: '127.0.0.1',
      label: 'Localhost / Réseau local',
    };
  }

  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined;
    }
    const val = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const forwarded = getHeader('x-forwarded-for');
  let ip = '127.0.0.1';
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else {
    ip = getHeader('x-real-ip') || getHeader('cf-connecting-ip') || '127.0.0.1';
  }

  // Geo headers provided by modern hosts (Vercel, Cloudflare, etc.)
  const city = getHeader('x-vercel-ip-city') || getHeader('cf-ipcity') || undefined;
  const country = getHeader('x-vercel-ip-country-name') || getHeader('cf-ipcountry') || getHeader('x-vercel-ip-country') || undefined;

  let label = ip;
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    label = 'Localhost / Réseau local';
  } else if (city && country) {
    label = `${decodeURIComponent(city)}, ${country} (${ip})`;
  } else if (country) {
    label = `${country} (${ip})`;
  }

  return {
    ip,
    city: city ? decodeURIComponent(city) : undefined,
    country,
    label,
  };
}
