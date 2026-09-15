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

/**
 * Cleans and standardizes raw device model strings.
 * e.g. "Pixel 7 Pro" -> "Google Pixel 7 Pro"
 */
export function formatDeviceModel(rawModel: string): string {
  let model = rawModel.trim();
  if (!model || model.toLowerCase() === 'k' || model.toLowerCase() === 'unknown') {
    return '';
  }

  // Remove surrounding quotes if header was sent quoted (e.g. '"Pixel 7 Pro"')
  model = model.replace(/^["']+|["']+$/g, '').trim();

  // Google Pixel models
  if (/^pixel/i.test(model)) {
    return `Google ${model.replace(/^pixel\s*/i, 'Pixel ')}`;
  }
  if (/google\s*pixel/i.test(model)) {
    return model;
  }

  // Samsung models
  if (/^sm-[a-z0-9]+/i.test(model)) {
    return `Samsung Galaxy (${model})`;
  }
  if (/samsung/i.test(model) && !/galaxy/i.test(model)) {
    return `Samsung Galaxy ${model.replace(/samsung\s*/i, '')}`;
  }

  // Apple devices
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
export function extractDeviceModelFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | undefined
): string | undefined {
  if (!headers) return undefined;

  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined;
    }
    const val = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const raw =
    getHeader('x-device-name') ||
    getHeader('x-device-model') ||
    getHeader('sec-ch-ua-model');

  if (!raw) return undefined;
  const formatted = formatDeviceModel(raw);
  return formatted || undefined;
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

  // Detect Device Model
  let model: string | undefined = undefined;

  if (explicitModel && explicitModel.trim()) {
    const formatted = formatDeviceModel(explicitModel);
    if (formatted) model = formatted;
  }

  if (!model && userAgent) {
    // 1. Check for Android device pattern in UA: (Linux; Android 14; Pixel 7 Pro Build/...)
    const androidMatch = userAgent.match(/android\s+[\d.]+;\s*([^;()]+?)(?:\s+build|\s*;|\))/i);
    if (androidMatch && androidMatch[1]) {
      const candidate = androidMatch[1].trim();
      if (candidate.toLowerCase() !== 'k') {
        const formatted = formatDeviceModel(candidate);
        if (formatted) model = formatted;
      }
    }

    // 2. Look for Pixel in UA if not caught
    if (!model) {
      const pixelMatch = userAgent.match(/(?:google\s+)?(pixel\s+[\w\s]+?)(?:\s+build|\s*;|\/|\))/i);
      if (pixelMatch && pixelMatch[1]) {
        model = formatDeviceModel(pixelMatch[1]);
      }
    }

    // 3. Apple devices
    if (!model && ua.includes('iphone')) {
      model = 'iPhone';
    } else if (!model && ua.includes('ipad')) {
      model = 'iPad';
    }
  }

  const typeLabel = deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablette' : 'PC';

  // Build clean and prominent label
  let label: string;
  if (model) {
    label = `${model} • ${browser} (${typeLabel})`;
  } else {
    label = `${browser} sur ${os} (${typeLabel})`;
  }

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
