export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  model?: string;
  label: string;
}

export interface LocationInfo {
  ip: string;
  city?: string;
  country?: string;
  label: string;
}

export type HeaderContainer = Headers | Record<string, string | string[] | undefined> | undefined | null;

/**
 * Universal safe header getter supporting Fetch Headers and Node/Next.js Record structures.
 */
export function getHeader(headers: HeaderContainer, name: string): string | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return headers.get(name) || undefined;
  }
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct[0];
  return direct;
}

/**
 * Cleans and standardizes raw device model strings.
 * e.g. "Pixel 7 Pro" -> "Google Pixel 7 Pro"
 */
export function formatDeviceModel(rawModel: string): string {
  let model = rawModel.trim();
  if (!model || model.toLowerCase() === 'k' || model.toLowerCase() === 'unknown') {
    return '';
  }

  model = model.replace(/^["']+|["']+$/g, '').trim();

  // Google Pixel
  if (/^pixel/i.test(model)) {
    return `Google ${model.replace(/^pixel\s*/i, 'Pixel ')}`;
  }
  if (/google\s*pixel/i.test(model)) {
    return model;
  }

  // Samsung
  if (/^sm-[a-z0-9]+/i.test(model)) {
    return `Samsung Galaxy (${model})`;
  }
  if (/samsung/i.test(model) && !/galaxy/i.test(model)) {
    return `Samsung Galaxy ${model.replace(/samsung\s*/i, '')}`;
  }

  // Apple
  if (/iphone/i.test(model)) return 'iPhone';
  if (/ipad/i.test(model)) return 'iPad';
  if (/macintosh|macbook/i.test(model)) return 'Mac';

  // Xiaomi / Redmi
  if (/^2[0-9]{3}[0-9a-z]+/i.test(model) || /^m2[0-9]+/i.test(model)) {
    return `Xiaomi (${model})`;
  }

  return model;
}

/**
 * Extracts device model from incoming HTTP headers (sec-ch-ua-model, x-device-name, etc.)
 */
export function extractDeviceModelFromHeaders(headers: HeaderContainer): string | undefined {
  const raw =
    getHeader(headers, 'x-device-name') ||
    getHeader(headers, 'x-device-model') ||
    getHeader(headers, 'sec-ch-ua-model');

  if (!raw) return undefined;
  return formatDeviceModel(raw) || undefined;
}

/**
 * Parses user-agent header and optional explicit model into structured device information.
 */
export function parseDeviceInfo(
  userAgent: string | null | undefined,
  explicitModel?: string | null
): DeviceInfo {
  if (!userAgent && !explicitModel) {
    return {
      browser: 'Inconnu',
      os: 'Inconnu',
      deviceType: 'desktop',
      label: 'Appareil inconnu',
    };
  }

  const ua = (userAgent || '').toLowerCase();

  // OS Detection
  let os = 'Inconnu';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) {
    os = ua.includes('iphone') ? 'iOS (iPhone)' : ua.includes('ipad') ? 'iPadOS' : 'macOS';
  } else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';

  // Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
    deviceType = 'tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = 'mobile';
  }

  // Browser
  let browser = 'Navigateur inconnu';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';

  // Device Model
  let model: string | undefined = undefined;

  if (explicitModel && explicitModel.trim()) {
    const formatted = formatDeviceModel(explicitModel);
    if (formatted) model = formatted;
  }

  if (!model && userAgent) {
    const androidMatch = userAgent.match(/android\s+[\d.]+;\s*([^;()]+?)(?:\s+build|\s*;|\))/i);
    if (androidMatch && androidMatch[1]) {
      const candidate = androidMatch[1].trim();
      if (candidate.toLowerCase() !== 'k') {
        const formatted = formatDeviceModel(candidate);
        if (formatted) model = formatted;
      }
    }

    if (!model) {
      const pixelMatch = userAgent.match(/(?:google\s+)?(pixel\s+[\w\s]+?)(?:\s+build|\s*;|\/|\))/i);
      if (pixelMatch && pixelMatch[1]) {
        model = formatDeviceModel(pixelMatch[1]);
      }
    }

    if (!model && ua.includes('iphone')) {
      model = 'iPhone';
    } else if (!model && ua.includes('ipad')) {
      model = 'iPad';
    }
  }

  const typeLabel = deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablette' : 'PC';
  const label = model
    ? `${model} • ${browser} (${typeLabel})`
    : `${browser} sur ${os} (${typeLabel})`;

  return {
    browser,
    os,
    deviceType,
    model,
    label,
  };
}

/**
 * Extracts IP and location labels from incoming HTTP headers.
 */
export function extractLocationInfo(headers: HeaderContainer): LocationInfo {
  if (!headers) {
    return {
      ip: '127.0.0.1',
      label: 'Localhost / Réseau local',
    };
  }

  const forwarded = getHeader(headers, 'x-forwarded-for');
  let ip = '127.0.0.1';
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else {
    ip = getHeader(headers, 'x-real-ip') || getHeader(headers, 'cf-connecting-ip') || '127.0.0.1';
  }

  const city = getHeader(headers, 'x-vercel-ip-city') || getHeader(headers, 'cf-ipcity') || undefined;
  const country =
    getHeader(headers, 'x-vercel-ip-country-name') ||
    getHeader(headers, 'cf-ipcountry') ||
    getHeader(headers, 'x-vercel-ip-country') ||
    undefined;

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
