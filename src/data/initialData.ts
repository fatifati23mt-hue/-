import { PaymentMethod, PlatformState, SectionType, TeachingMethod } from '../types';

export const WHATSAPP_NUMBER_DISPLAY = '0563558678';
export const WHATSAPP_BASE_URL = 'https://wa.me/213563558678';

export const LEVELS: { value: string; label: string }[] = [
  { value: 'التحضيري', label: 'القسم التحضيري' },
  { value: 'السنة الأولى ابتدائي', label: 'السنة الأولى ابتدائي' },
  { value: 'السنة الثانية ابتدائي', label: 'السنة الثانية ابتدائي' },
  { value: 'السنة الثالثة ابتدائي', label: 'السنة الثالثة ابتدائي' },
  { value: 'السنة الرابعة ابتدائي', label: 'السنة الرابعة ابتدائي' },
  { value: 'السنة الخامسة ابتدائي', label: 'السنة الخامسة ابتدائي' },
  { value: 'السنة الأولى متوسط', label: 'السنة الأولى متوسط' },
  { value: 'السنة الثانية متوسط', label: 'السنة الثانية متوسط' },
  { value: 'السنة الثالثة متوسط', label: 'السنة الثالثة متوسط' },
  { value: 'السنة الرابعة متوسط', label: 'السنة الرابعة متوسط (BEM)' },
  { value: 'السنة الأولى ثانوي', label: 'السنة الأولى ثانوي' },
  { value: 'السنة الثانية ثانوي', label: 'السنة الثانية ثانوي' },
  { value: 'السنة الثالثة ثانوي', label: 'السنة الثالثة ثانوي (BAC)' },
];

export const LEVEL_STREAMS: Record<string, string[]> = {
  التحضيري: ['القسم التحضيري العام', 'تربية تحضيرية مبكرة'],
  'السنة الأولى ابتدائي': ['التعليم الابتدائي العام'],
  'السنة الثانية ابتدائي': ['التعليم الابتدائي العام'],
  'السنة الثالثة ابتدائي': ['التعليم الابتدائي العام'],
  'السنة الرابعة ابتدائي': ['التعليم الابتدائي العام'],
  'السنة الخامسة ابتدائي': ['التعليم الابتدائي العام'],
  'السنة الأولى متوسط': ['التعليم المتوسط العام'],
  'السنة الثانية متوسط': ['التعليم المتوسط العام'],
  'السنة الثالثة متوسط': ['التعليم المتوسط العام'],
  'السنة الرابعة متوسط': ['التعليم المتوسط العام (شهادة BEM)'],
  'السنة الأولى ثانوي': ['جذع مشترك علوم وتكنولوجيا', 'جذع مشترك آداب وفلسفة'],
  'السنة الثانية ثانوي': [
    'علوم تجريبية',
    'رياضيات',
    'تقني رياضي',
    'تسيير واقتصاد',
    'آداب وفلسفة',
    'لغات أجنبية',
  ],
  'السنة الثالثة ثانوي': [
    'علوم تجريبية (بكالوريا)',
    'رياضيات (بكالوريا)',
    'تقني رياضي (بكالوريا)',
    'تسيير واقتصاد (بكالوريا)',
    'آداب وفلسفة (بكالوريا)',
    'لغات أجنبية (بكالوريا)',
  ],
};

export const SUBJECTS: string[] = [
  'الرياضيات',
  'العلوم الطبيعية والحياة',
  'العلوم الفيزيائية',
  'اللغة العربية وآدابها',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'التاريخ والجغرافيا',
  'العلوم الإسلامية',
  'الفلسفة',
  'التسيير المحاسبي والمالي',
  'الاقتصاد والمناجمنت',
  'القانون',
  'الهندسة (مدنية/ميكانيكية/كهربائية)',
  'اللغة الأمازيغية',
  'الإعلام الآلي',
  'مواد التحضيري والابتدائي',
];

export const SECTION_TYPES: SectionType[] = [
  'قسم خاص فردي',
  'قسم مجموعة مصغرة (8-10 تلاميذ)',
  'قسم جماعي (عدد غير محدود)',
];

export const TEACHING_METHODS: TeachingMethod[] = [
  'Zoom',
  'Telegram',
  'Google Meet',
  'YouTube',
  'WhatsApp',
  'دروس مسجلة',
];

export function createSampleReceiptSvg(params: {
  method: PaymentMethod;
  ref: string;
  amount: number;
  studentName: string;
  date: string;
}): string {
  const accent = params.method === 'BaridiMob' ? '#ffd700' : '#26c6da';
  const headerLabel =
    params.method === 'BaridiMob'
      ? 'ALGERIE POSTE · BARIDIMOB'
      : 'ALGERIE POSTE · COMPTE CCP';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="320" viewBox="0 0 520 320">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071526"/>
      <stop offset="100%" stop-color="#0c2f3b"/>
    </linearGradient>
  </defs>
  <rect width="520" height="320" rx="18" fill="url(#bg)" stroke="${accent}" stroke-width="2"/>
  <rect x="20" y="20" width="480" height="52" rx="10" fill="#0d1d31" stroke="${accent}" stroke-opacity="0.45"/>
  <text x="260" y="52" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="700" font-size="16" letter-spacing="1">${headerLabel}</text>
  <text x="480" y="108" text-anchor="end" fill="#94a3b8" font-family="sans-serif" font-size="13">رقم العملية المرجعي:</text>
  <text x="40" y="108" text-anchor="start" fill="#f8fafc" font-family="monospace" font-weight="700" font-size="15">${params.ref}</text>
  <line x1="36" y1="124" x2="484" y2="124" stroke="#1e293b" stroke-width="1"/>
  <text x="480" y="156" text-anchor="end" fill="#94a3b8" font-family="sans-serif" font-size="13">التلميذ المستفيد:</text>
  <text x="40" y="156" text-anchor="start" fill="#f8fafc" font-family="sans-serif" font-weight="700" font-size="15">${params.studentName}</text>
  <line x1="36" y1="172" x2="484" y2="172" stroke="#1e293b" stroke-width="1"/>
  <text x="480" y="204" text-anchor="end" fill="#94a3b8" font-family="sans-serif" font-size="13">تاريخ التحويل:</text>
  <text x="40" y="204" text-anchor="start" fill="#cbd5e1" font-family="monospace" font-size="14">${params.date}</text>
  <rect x="36" y="230" width="448" height="62" rx="12" fill="#07111e" stroke="${accent}" stroke-opacity="0.6"/>
  <text x="464" y="268" text-anchor="end" fill="#cbd5e1" font-family="sans-serif" font-size="14">المبلغ المحوّل:</text>
  <text x="56" y="270" text-anchor="start" fill="${accent}" font-family="monospace" font-weight="700" font-size="22">${params.amount.toLocaleString('en-US')} DZD</text>
</svg>`.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_PLATFORM_STATE: PlatformState = {
  ccp: '0012345678 المفتاح 45',
  baridi: '00799999001234567845',
  teacherCcp: '0098765432 المفتاح 12',
  approvedGrossTotal: 0,
  approvedReceiptsCount: 0,
  platformSharePct: 70,
  teacherSharePct: 30,
  activeSection: 'قسم خاص فردي',
  billingCycle: 'monthly',
  prices: {
    'قسم خاص فردي': 6000,
    'قسم مجموعة مصغرة (8-10 تلاميذ)': 3500,
    'قسم جماعي (عدد غير محدود)': 1800,
  },
  annualPrices: {
    'قسم خاص فردي': 48000,
    'قسم مجموعة مصغرة (8-10 تلاميذ)': 28000,
    'قسم جماعي (عدد غير محدود)': 14500,
  },
  sectionsMeta: {
    'قسم خاص فردي': {
      reg: 0,
      pres: 0,
      max: 1,
      desc: 'تلميذ واحد فقط (1/1)',
      shortLabel: 'قسم خاص فردي',
      badgeText: '1 تلميذ فقط',
      summary:
        'حصة فردية خاصة ومباشرة بين الأستاذ وتلميذ واحد فقط، مع متابعة مركزة بنسبة 100% وتكييف البرنامج حسب مستوى التلميذ.',
    },
    'قسم مجموعة مصغرة (8-10 تلاميذ)': {
      reg: 4,
      pres: 4,
      max: 10,
      desc: 'مجموعة من 8 إلى 10 تلاميذ',
      shortLabel: 'مجموعة مصغرة',
      badgeText: 'من 8 إلى 10 تلاميذ',
      summary:
        'قسم تفاعلي يضم مجموعة قليلة تتراوح بين 8 إلى 10 تلاميذ كحد أقصى، يضمن النقاش المباشر وحل التمارين الجماعي.',
    },
    'قسم جماعي (عدد غير محدود)': {
      reg: 28,
      pres: 25,
      max: null,
      desc: 'عدد غير محدود من التلاميذ',
      shortLabel: 'قسم جماعي مفتوح',
      badgeText: 'عدد غير محدود',
      summary:
        'قسم جماعي يستوعب عدداً غير محدود من التلاميذ بسعر اقتصادي، يشمل البث المباشر والتسجيلات والملخصات الشاملة.',
    },
  },
  admins: [],
  teachers: [],
  registeredUsers: [],
  roster: [],
  lessons: [],
  certificates: [],
  receipts: [],
  payouts: [],
};

export function buildWhatsAppLink(message: string): string {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

export function formatDzd(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} دج`;
}

export function triggerDocumentDownload(fileName: string, contentLines: string[]): void {
  const blob = new Blob([contentLines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.txt') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
