export interface BrandContact {
  phone: string;
  address: string;
  email: string;
  hours: string;
  socialLinks: Array<{ label: string; href: string; username?: string }>;
}

export interface BrandConfig {
  name: string;
  logoText: string;
  description: string;
  contact: BrandContact;
}

export interface ThemeConfig {
  brand: BrandConfig;
  colors: Record<string, string>;
  // تحديد أدوار الألوان بناءً على قاعدة 60-30-10 لتسهيل التطبيق في الـ UI
  colorRoles: {
    dominant60: {
      background: string;
      surface: string;
      surfaceCard: string;
    };
    secondary30: {
      textMain: string;
      brandIdentity: string;
      textMuted: string;
    };
    accent10: {
      yellowPrimary: string;
      yellowLight: string;
      textOnYellow: string;
    };
  };
  borderRadius: Record<string, string>;
  spacing: Record<string, string>;
  boxShadow: Record<string, string>;
  fonts: Record<string, string[]>;
}

export const THEME_CONFIG: ThemeConfig = {
  brand: {
    name: "Délices d’Eva",
    logoText: "Délices d’Eva",
    description: "Une Délices d’Eva de tradition, bio et engagée.",
    contact: {
      phone: "+33695049833",
      address: "15 Rue de la Paix, 75002 Paris, France",
      email: "contact@lesdelicesdeva.fr",
      hours: "Lundi - Samedi : 7h00 - 18h00 | Dimanche : Fermé",
      socialLinks: [
        {
          label: "Instagram",
          href: "https://www.instagram.com/lesdelices.d.eva?igsh=aDQwZGYyMXNpeG5n",
          username: "lesdelices.d.eva",
        },
        {
          label: "TikTok",
          href: "https://www.tiktok.com/@les.delices.d.eva?_r=1&_t=ZS-96y0UWvpi3o",
          username: "les.delices.d.eva",
        },
      ],
    },
  },
  colors: {
    "on-surface-variant": "#45464f",
    "secondary-container": "#fdf48f",
    surface: "#f8f9ff",
    "surface-container-lowest": "#ffffff",
    "on-tertiary-fixed": "#1b1c17",
    "on-tertiary-container": "#f1f0e8",
    "tertiary-fixed-dim": "#c8c7bf",
    "tertiary-fixed": "#e4e3db",
    "primary-container": "#4b1cb6",
    "error-container": "#ffdad6",
    "on-tertiary-fixed-variant": "#474742",
    "inverse-surface": "#27313f",
    "outline-variant": "#c5c6d3",
    "inverse-on-surface": "#eaf1ff",
    error: "#ba1a1a",
    tertiary: "#7136ce",
    "surface-bright": "#f8f9ff",
    "surface-tint": "#5021af",
    "inverse-primary": "#cfbcff",
    "on-background": "#1a1b23",
    "on-primary-fixed": "#1d0061",
    "on-secondary-fixed": "#221b00",
    "tertiary-container": "#6d6d67",
    "on-secondary": "#ffffff",
    "on-error-container": "#93000a",
    "primary-fixed-dim": "#cfbcff",
    primary: "#30048d",
    outline: "#757682",
    "on-primary-container": "#e8dfff",
    "surface-dim": "#d2d5de",
    "primary-fixed": "#e8dfff",
    background: "#f8f9ff",
    secondary: "#7d6a00",
    "surface-container-highest": "#d2d5de",
    "on-tertiary": "#ffffff",
    "secondary-fixed-dim": "#e0c75c",
    "on-surface": "#1a1b23",
    "on-error": "#ffffff",
    "on-primary": "#ffffff",
    "on-primary-fixed-variant": "#391986",
    "surface-container-low": "#f1f3f9",
    "surface-variant": "#e1e2ec",
    "surface-container": "#e8ebf3",
    "surface-container-high": "#dee0e8",
    "on-secondary-container": "#302800",
    "secondary-fixed": "#EAB308",
    "on-secondary-fixed-variant": "#4f4000",
  },

  // تطبيق توزيع قاعدة 60 - 30 - 10 بشكل صريح ومباشر
  colorRoles: {
    dominant60: {
      background: "#f8f9ff", // مساحة الخلفية الأساسية (Light Surface)
      surface: "#ffffff",    // الأقسام الكبيرة (Light Surface)
      surfaceCard: "#ffffff", // بطاقات المنتجات والقوائم (Light Surface)
    },
    secondary30: {
      textMain: "#1a1b23", // النصوص الأساسية والعناوين (Deep Text)
      brandIdentity: "#30048d", // لون الهوية الأساسي (Deep Brand Color)
      textMuted: "#30048d", // النصوص الفرعية والوصف (Deep Brand Color)
    },
    accent10: {
      yellowPrimary: "#2a1082", // اللون الأزرق الداكن للأزرار والهايلايت (البطاقات)
      yellowLight: "#2a1082",   // نفس درجة اللون الأزرق للأزرار الفورية
      textOnYellow: "#ffffff",  // لون النص أبيض لتباين مثالي وسهل القراءة
    },
  },

  borderRadius: {
    DEFAULT: "0.25rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },
  spacing: {
    xs: "4px",
    sm: "12px",
    md: "24px",
    lg: "48px",
    xl: "80px",
    gutter: "24px",
    "container-max": "1280px",
  },
  boxShadow: {
    soft: "0 15px 30px -15px rgba(48, 4, 141, 0.08)",
  },
  fonts: {
    body: ["var(--font-outfit)", "sans-serif"],
    display: ["var(--font-fredoka)", "sans-serif"],
  },
};
