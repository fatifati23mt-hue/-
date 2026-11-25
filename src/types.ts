export type PortalTab = 'student' | 'parent' | 'teacher' | 'admin' | 'sections';

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';

export type SectionType =
  | 'قسم خاص فردي'
  | 'قسم مجموعة مصغرة (8-10 تلاميذ)'
  | 'قسم جماعي (عدد غير محدود)';

export type BillingCycle = 'monthly' | 'annual';

export type TeachingMethod =
  | 'Zoom'
  | 'Telegram'
  | 'Google Meet'
  | 'YouTube'
  | 'WhatsApp'
  | 'دروس مسجلة';

export type PaymentMethod = 'BaridiMob' | 'CCP';

export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  ccp?: string;
  baridi?: string;
  phone?: string;
  level?: string;
  stream?: string;
  subject?: string;
}

export interface SectionMeta {
  reg: number;
  pres: number;
  max: number | null; // null represents unlimited capacity
  desc: string;
  shortLabel: string;
  badgeText: string;
  summary: string;
}

export interface AdminMember {
  id: string;
  uid: string;
  name: string;
  email: string;
  isPrimary: boolean;
}

export interface TeacherMember {
  id: string;
  uid: string;
  name: string;
  subject: string;
}

export interface RosterStudent {
  id: string;
  name: string;
  status: 'حاضر' | 'غائب';
  time: string;
  teacherId: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: string;
  stream: string;
  subject: string;
  method: TeachingMethod;
  link: string;
  fileName: string;
  allowDownload: boolean;
  time: string;
  teacherName: string;
  authorId: string;
}

export interface Certificate {
  id: string;
  recipient: string;
  recipientRole: 'تلميذ' | 'أستاذ';
  reason: string;
  issuer: string;
  issuerId: string;
  date: string;
}

export interface PaymentReceipt {
  id: string;
  ownerId: string;
  studentName: string;
  submittedBy: 'تلميذ' | 'ولي أمر';
  level: string;
  stream: string;
  subject: string;
  sectionType: SectionType;
  amount: number;
  method: PaymentMethod;
  ref: string;
  fileName: string;
  previewUrl: string;
  isPdf: boolean;
  status: ReceiptStatus;
  date: string;
}

export interface PayoutRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  amount: number;
  ccp: string;
  date: string;
  status: 'قيد التحويل' | 'تم التحويل';
}

export interface PlatformState {
  ccp: string;
  baridi: string;
  teacherCcp: string;
  approvedGrossTotal: number;
  approvedReceiptsCount: number;
  platformSharePct: number;
  teacherSharePct: number;
  activeSection: SectionType;
  billingCycle: BillingCycle;
  prices: Record<SectionType, number>;
  annualPrices: Record<SectionType, number>;
  sectionsMeta: Record<SectionType, SectionMeta>;
  admins: AdminMember[];
  teachers: TeacherMember[];
  registeredUsers: UserProfile[];
  roster: RosterStudent[];
  lessons: Lesson[];
  certificates: Certificate[];
  receipts: PaymentReceipt[];
  payouts: PayoutRequest[];
}

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}
