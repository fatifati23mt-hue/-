import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  CreditCard,
  Crown,
  Download,
  Eye,
  IdCard,
  Landmark,
  Lock,
  Percent,
  Printer,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { PaymentReceipt, PlatformState, ReceiptStatus, SectionType, UserProfile } from '../types';
import { SUBJECTS, formatDzd } from '../data/initialData';

interface TeacherCardRecord {
  uid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  subject: string;
  ccp: string;
  email: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildTeacherCardSvg(card: TeacherCardRecord): string {
  const issueDate = new Date().toISOString().slice(0, 10);
  const fullName = escapeXml(card.fullName || 'أستاذ منصة النبراس');
  const firstName = escapeXml(card.firstName || '—');
  const lastName = escapeXml(card.lastName || '—');
  const birthDate = escapeXml(card.birthDate || 'غير محدد');
  const subject = escapeXml(card.subject || 'غير محددة');
  const ccp = escapeXml(card.ccp || 'غير محدد');
  const email = escapeXml(card.email || '—');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" direction="rtl">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07111e"/>
      <stop offset="55%" stop-color="#0b2339"/>
      <stop offset="100%" stop-color="#08333f"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffd700"/>
      <stop offset="55%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#b08f26"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="876" height="496" rx="28" fill="url(#bg)" stroke="url(#gold)" stroke-width="3"/>
  <rect x="12" y="12" width="876" height="96" rx="28" fill="#0d1d31"/>
  <line x1="36" y1="108" x2="864" y2="108" stroke="#d4af37" stroke-opacity="0.55" stroke-width="1.5"/>

  <text x="850" y="54" text-anchor="end" fill="#ffd700" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="22" font-weight="800">منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى</text>
  <text x="850" y="84" text-anchor="end" fill="#4dd0e1" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="15" font-weight="700">بطاقة معلومات الأستاذ الرسمية</text>

  <rect x="44" y="34" width="142" height="40" rx="12" fill="url(#gold)"/>
  <text x="115" y="60" text-anchor="middle" fill="#07111e" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="16" font-weight="800">أستاذ معتمد</text>

  <text x="850" y="154" text-anchor="end" fill="#ffffff" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="26" font-weight="800">${fullName}</text>

  <!-- Row 1: First Name & Last Name -->
  <rect x="466" y="176" width="388" height="74" rx="14" fill="#07111e" stroke="#1e293b" stroke-width="1.5"/>
  <text x="836" y="202" text-anchor="end" fill="#94a3b8" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">الاسم</text>
  <text x="836" y="232" text-anchor="end" fill="#ffffff" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="18" font-weight="800">${firstName}</text>

  <rect x="46" y="176" width="398" height="74" rx="14" fill="#07111e" stroke="#1e293b" stroke-width="1.5"/>
  <text x="426" y="202" text-anchor="end" fill="#94a3b8" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">اللقب</text>
  <text x="426" y="232" text-anchor="end" fill="#ffffff" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="18" font-weight="800">${lastName}</text>

  <!-- Row 2: Subject & Birth Date -->
  <rect x="466" y="266" width="388" height="74" rx="14" fill="#07111e" stroke="#26c6da" stroke-opacity="0.55" stroke-width="1.5"/>
  <text x="836" y="292" text-anchor="end" fill="#4dd0e1" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">مادة التدريس</text>
  <text x="836" y="322" text-anchor="end" fill="#e0f7fa" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="18" font-weight="800">${subject}</text>

  <rect x="46" y="266" width="398" height="74" rx="14" fill="#07111e" stroke="#1e293b" stroke-width="1.5"/>
  <text x="426" y="292" text-anchor="end" fill="#94a3b8" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">تاريخ الميلاد</text>
  <text x="426" y="322" text-anchor="end" fill="#80deea" font-family="IBM Plex Mono, monospace" font-size="18" font-weight="700" direction="ltr">${birthDate}</text>

  <!-- Row 3: CCP & Email -->
  <rect x="466" y="356" width="388" height="74" rx="14" fill="#07111e" stroke="#d4af37" stroke-opacity="0.65" stroke-width="1.5"/>
  <text x="836" y="382" text-anchor="end" fill="#ffd700" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">رقم CCP الخاص بالأستاذ</text>
  <text x="836" y="412" text-anchor="end" fill="#ffd700" font-family="IBM Plex Mono, monospace" font-size="18" font-weight="800" direction="ltr">${ccp}</text>

  <rect x="46" y="356" width="398" height="74" rx="14" fill="#07111e" stroke="#1e293b" stroke-width="1.5"/>
  <text x="426" y="382" text-anchor="end" fill="#94a3b8" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">البريد الإلكتروني</text>
  <text x="426" y="412" text-anchor="end" fill="#e2e8f0" font-family="IBM Plex Mono, monospace" font-size="15" font-weight="700" direction="ltr">${email}</text>

  <!-- Footer -->
  <line x1="36" y1="452" x2="864" y2="452" stroke="#334155" stroke-width="1"/>
  <text x="850" y="484" text-anchor="end" fill="#94a3b8" font-family="Cairo, Tajawal, Segoe UI, Tahoma, Arial, sans-serif" font-size="13" font-weight="700">الختم الإداري: إدارة منصة النبراس التعليمية</text>
  <text x="48" y="484" text-anchor="start" fill="#94a3b8" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="700" direction="ltr">تاريخ الإصدار: ${issueDate}</text>
</svg>`;
}

interface AdminPortalProps {
  state: PlatformState;
  userProfile: UserProfile | null;
  isAuthorized: boolean;
  platformShareAmount: number;
  teacherShareAmount: number;
  onSaveAdminCard: (card: {
    firstName: string;
    lastName: string;
    birthDate: string;
    ccp: string;
    baridi: string;
  }) => Promise<void>;
  onSaveBanking: (ccp: string, baridi: string) => Promise<void>;
  onSavePrices: (
    prices: Record<SectionType, number>,
    annualPrices: Record<SectionType, number>
  ) => Promise<void>;
  onSaveRevenueSplit: (platformPct: number, teacherPct: number) => Promise<void>;
  onGrantTeacherHonor: (teacherName: string) => Promise<void>;
  onAddAdmin: (name: string, email: string) => Promise<void>;
  onPromoteUserToTeacher: (user: UserProfile, subject: string) => Promise<void>;
  onRemoveAdmin: (adminId: string) => Promise<void>;
  onRemoveTeacher: (teacherId: string) => Promise<void>;
  onUpdateReceiptStatus: (receiptId: string, status: ReceiptStatus) => Promise<void>;
  onCompletePayout: (payoutId: string) => Promise<void>;
  onPreviewReceipt: (receipt: PaymentReceipt) => void;
  onCopyText: (label: string, value: string) => void;
  onDownloadSourceCode: () => Promise<void>;
  isExportingSource: boolean;
  onNotify: (text: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  state,
  userProfile,
  isAuthorized,
  platformShareAmount,
  teacherShareAmount,
  onSaveAdminCard,
  onSaveBanking,
  onSavePrices,
  onSaveRevenueSplit,
  onGrantTeacherHonor,
  onAddAdmin,
  onPromoteUserToTeacher,
  onRemoveAdmin,
  onRemoveTeacher,
  onUpdateReceiptStatus,
  onCompletePayout,
  onPreviewReceipt,
  onCopyText,
  onDownloadSourceCode,
  isExportingSource,
  onNotify,
}) => {
  const [ccpInput, setCcpInput] = useState<string>(state.ccp);
  const [baridiInput, setBaridiInput] = useState<string>(state.baridi);

  const [pricePrivate, setPricePrivate] = useState<string>(
    String(state.prices['قسم خاص فردي'])
  );
  const [priceSmall, setPriceSmall] = useState<string>(
    String(state.prices['قسم مجموعة مصغرة (8-10 تلاميذ)'])
  );
  const [priceGroup, setPriceGroup] = useState<string>(
    String(state.prices['قسم جماعي (عدد غير محدود)'])
  );

  const [annualPrivate, setAnnualPrivate] = useState<string>(
    String(state.annualPrices['قسم خاص فردي'])
  );
  const [annualSmall, setAnnualSmall] = useState<string>(
    String(state.annualPrices['قسم مجموعة مصغرة (8-10 تلاميذ)'])
  );
  const [annualGroup, setAnnualGroup] = useState<string>(
    String(state.annualPrices['قسم جماعي (عدد غير محدود)'])
  );

  const [splitEditorOpen, setSplitEditorOpen] = useState<boolean>(false);
  const [platformPctInput, setPlatformPctInput] = useState<number>(state.platformSharePct);
  const [teacherPctInput, setTeacherPctInput] = useState<number>(state.teacherSharePct);
  const [isSavingSplit, setIsSavingSplit] = useState<boolean>(false);

  const [adminInfoOpen, setAdminInfoOpen] = useState<boolean>(false);
  const [adminBankingPanelOpen, setAdminBankingPanelOpen] = useState<boolean>(false);
  const [adminFirstName, setAdminFirstName] = useState<string>(
    userProfile?.firstName || userProfile?.displayName?.split(' ')[0] || ''
  );
  const [adminLastName, setAdminLastName] = useState<string>(
    userProfile?.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || ''
  );
  const [adminBirthDate, setAdminBirthDate] = useState<string>(userProfile?.birthDate || '');
  const [adminCardCcp, setAdminCardCcp] = useState<string>(userProfile?.ccp || state.ccp);
  const [adminCardBaridi, setAdminCardBaridi] = useState<string>(
    userProfile?.baridi || state.baridi
  );
  const [isSavingAdminCard, setIsSavingAdminCard] = useState<boolean>(false);
  const [isSavingAdminBanking, setIsSavingAdminBanking] = useState<boolean>(false);
  const [teacherCardPanelOpen, setTeacherCardPanelOpen] = useState<boolean>(false);
  const [selectedTeacherCardUid, setSelectedTeacherCardUid] = useState<string>('');

  const [honorTeacher, setHonorTeacher] = useState<string>('');
  const [addAdminOpen, setAddAdminOpen] = useState<boolean>(false);
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [isAddingAdmin, setIsAddingAdmin] = useState<boolean>(false);
  const [selectedUserUid, setSelectedUserUid] = useState<string>('');
  const [teacherSubject, setTeacherSubject] = useState<string>(SUBJECTS[0]);
  const [receiptFilter, setReceiptFilter] = useState<'all' | ReceiptStatus>('all');

  useEffect(() => {
    setCcpInput(state.ccp);
    setBaridiInput(state.baridi);
  }, [state.ccp, state.baridi]);

  useEffect(() => {
    if (userProfile?.firstName !== undefined) setAdminFirstName(userProfile.firstName);
    if (userProfile?.lastName !== undefined) setAdminLastName(userProfile.lastName);
    if (userProfile?.birthDate !== undefined) setAdminBirthDate(userProfile.birthDate);
    setAdminCardCcp(userProfile?.ccp || state.ccp);
    setAdminCardBaridi(userProfile?.baridi || state.baridi);
  }, [userProfile, state.ccp, state.baridi]);

  useEffect(() => {
    setPricePrivate(String(state.prices['قسم خاص فردي']));
    setPriceSmall(String(state.prices['قسم مجموعة مصغرة (8-10 تلاميذ)']));
    setPriceGroup(String(state.prices['قسم جماعي (عدد غير محدود)']));
  }, [state.prices]);

  useEffect(() => {
    setAnnualPrivate(String(state.annualPrices['قسم خاص فردي']));
    setAnnualSmall(String(state.annualPrices['قسم مجموعة مصغرة (8-10 تلاميذ)']));
    setAnnualGroup(String(state.annualPrices['قسم جماعي (عدد غير محدود)']));
  }, [state.annualPrices]);

  useEffect(() => {
    setPlatformPctInput(state.platformSharePct);
    setTeacherPctInput(state.teacherSharePct);
  }, [state.platformSharePct, state.teacherSharePct]);

  const filteredReceipts = useMemo(() => {
    if (receiptFilter === 'all') return state.receipts;
    return state.receipts.filter((r) => r.status === receiptFilter);
  }, [state.receipts, receiptFilter]);

  const counts = useMemo(() => {
    return {
      all: state.receipts.length,
      pending: state.receipts.filter((r) => r.status === 'pending').length,
      approved: state.receipts.filter((r) => r.status === 'approved').length,
      rejected: state.receipts.filter((r) => r.status === 'rejected').length,
    };
  }, [state.receipts]);

  const teacherCards = useMemo<TeacherCardRecord[]>(() => {
    const map = new Map<string, TeacherCardRecord>();

    const toRecord = (u: UserProfile, fallbackSubject?: string): TeacherCardRecord => {
      const parts = (u.displayName || '').trim().split(/\s+/);
      const firstName = u.firstName || parts[0] || '';
      const lastName = u.lastName || parts.slice(1).join(' ') || '';
      const fullName = `${firstName} ${lastName}`.trim() || u.displayName || 'أستاذ منصة النبراس';
      return {
        uid: u.uid,
        fullName,
        firstName,
        lastName,
        birthDate: u.birthDate || '',
        subject: u.subject || fallbackSubject || 'غير محددة',
        ccp: u.ccp || (u.uid === userProfile?.uid ? state.teacherCcp : ''),
        email: u.email || '',
      };
    };

    for (const t of state.teachers) {
      const matchedUser = state.registeredUsers.find((u) => u.uid === t.uid);
      if (matchedUser) {
        map.set(t.uid, toRecord(matchedUser, t.subject));
      } else {
        const parts = (t.name || '').trim().split(/\s+/);
        map.set(t.uid, {
          uid: t.uid,
          fullName: t.name || 'أستاذ معتمد',
          firstName: parts[0] || t.name || '',
          lastName: parts.slice(1).join(' ') || '',
          birthDate: '',
          subject: t.subject || 'غير محددة',
          ccp: '',
          email: '',
        });
      }
    }

    for (const u of state.registeredUsers) {
      if (u.role === 'teacher' && !map.has(u.uid)) {
        map.set(u.uid, toRecord(u));
      }
    }

    if (userProfile && !map.has(userProfile.uid)) {
      map.set(userProfile.uid, toRecord(userProfile, userProfile.subject || 'الرياضيات'));
    }

    return Array.from(map.values());
  }, [state.teachers, state.registeredUsers, userProfile, state.teacherCcp]);

  const activeTeacherCard =
    teacherCards.find((c) => c.uid === selectedTeacherCardUid) || teacherCards[0] || null;

  if (!isAuthorized) {
    return (
      <section className="surface-panel rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-gold/40 text-gold-royal flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-gold-royal">
          بوابة مدير المنصة محمية بقواعد الأمان
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          لا يملك حسابك الحالي صلاحية الإدارة العليا. يتم التحقق من صلاحيات المدير تلقائياً عبر حساب Google الموثّق وسجل الإدارة في Firestore، ولا يمكن تجاوز هذه الحماية من جهة المتصفح.
        </p>
      </section>
    );
  }

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCcp = ccpInput.trim().slice(0, 60);
    const cleanBaridi = baridiInput.trim().slice(0, 60);
    if (cleanCcp.length < 3 || cleanBaridi.length < 3) {
      onNotify('يرجى إدخال رقم CCP ورقم بريدي موب بشكل صحيح.', 'warning');
      return;
    }
    await onSaveBanking(cleanCcp, cleanBaridi);
  };

  const handlePricesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = Math.round(Number(pricePrivate));
    const p2 = Math.round(Number(priceSmall));
    const p3 = Math.round(Number(priceGroup));
    const a1 = Math.round(Number(annualPrivate));
    const a2 = Math.round(Number(annualSmall));
    const a3 = Math.round(Number(annualGroup));
    if (
      !Number.isFinite(p1) ||
      !Number.isFinite(p2) ||
      !Number.isFinite(p3) ||
      !Number.isFinite(a1) ||
      !Number.isFinite(a2) ||
      !Number.isFinite(a3) ||
      p1 < 0 ||
      p2 < 0 ||
      p3 < 0 ||
      p1 > 500000 ||
      p2 > 500000 ||
      p3 > 500000 ||
      a1 < 0 ||
      a2 < 0 ||
      a3 < 0 ||
      a1 > 5000000 ||
      a2 > 5000000 ||
      a3 > 5000000
    ) {
      onNotify('يرجى إدخال أسعار شهرية وسنوية صحيحة بالأرقام لكل قسم.', 'warning');
      return;
    }
    await onSavePrices(
      {
        'قسم خاص فردي': p1,
        'قسم مجموعة مصغرة (8-10 تلاميذ)': p2,
        'قسم جماعي (عدد غير محدود)': p3,
      },
      {
        'قسم خاص فردي': a1,
        'قسم مجموعة مصغرة (8-10 تلاميذ)': a2,
        'قسم جماعي (عدد غير محدود)': a3,
      }
    );
  };

  const handleHonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = honorTeacher.trim().slice(0, 100);
    if (!cleanName) {
      onNotify('يرجى إدخال اسم الأستاذ المراد تكريمه.', 'warning');
      return;
    }
    await onGrantTeacherHonor(cleanName);
    setHonorTeacher('');
  };

  const handlePlatformPctChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number.isFinite(val) ? val : 0)));
    setPlatformPctInput(clamped);
    setTeacherPctInput(100 - clamped);
  };

  const handleTeacherPctChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number.isFinite(val) ? val : 0)));
    setTeacherPctInput(clamped);
    setPlatformPctInput(100 - clamped);
  };

  const handleSaveSplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSplit(true);
    try {
      await onSaveRevenueSplit(platformPctInput, teacherPctInput);
      setSplitEditorOpen(false);
    } finally {
      setIsSavingSplit(false);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newAdminName.trim().slice(0, 100);
    const cleanEmail = newAdminEmail.trim().toLowerCase().slice(0, 120);
    if (!cleanName || !cleanEmail) {
      onNotify('يرجى إدخال اسم الأدمن والبريد الإلكتروني (حساب Google).', 'warning');
      return;
    }
    if (state.admins.length >= 3) {
      onNotify('تم بلوغ الحد الأقصى لعدد الأدمن (3 كأقصى حد).', 'warning');
      return;
    }
    setIsAddingAdmin(true);
    try {
      await onAddAdmin(cleanName, cleanEmail);
      setNewAdminName('');
      setNewAdminEmail('');
      setAddAdminOpen(false);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleSaveAdminCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = adminFirstName.trim().slice(0, 60);
    const cleanLast = adminLastName.trim().slice(0, 60);
    if (!cleanFirst || !cleanLast) {
      onNotify('يرجى إدخال اسم ولقب الأدمن قبل الحفظ.', 'warning');
      return;
    }
    setIsSavingAdminCard(true);
    try {
      await onSaveAdminCard({
        firstName: cleanFirst,
        lastName: cleanLast,
        birthDate: adminBirthDate.trim().slice(0, 20),
        ccp: adminCardCcp.trim().slice(0, 60),
        baridi: adminCardBaridi.trim().slice(0, 60),
      });
    } finally {
      setIsSavingAdminCard(false);
    }
  };

  const handleSaveAdminCardBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCcp = adminCardCcp.trim().slice(0, 60);
    const cleanBaridi = adminCardBaridi.trim().slice(0, 60);
    if (cleanCcp.length < 3 || cleanBaridi.length < 3) {
      onNotify('يرجى إدخال رقم CCP ورقم بريدي موب بشكل صحيح.', 'warning');
      return;
    }
    setIsSavingAdminBanking(true);
    try {
      await onSaveBanking(cleanCcp, cleanBaridi);
    } finally {
      setIsSavingAdminBanking(false);
    }
  };

  const handleDownloadTeacherCard = (card: TeacherCardRecord) => {
    const svg = buildTeacherCardSvg(card);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeFileName = (card.fullName || 'teacher').replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `بطاقة_معلومات_الأستاذ_${safeFileName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify(`تم تحميل بطاقة معلومات الأستاذ "${card.fullName}" بنجاح.`, 'success');
  };

  const handlePrintTeacherCard = (card: TeacherCardRecord) => {
    document.body.classList.add('printing-teacher-card');
    const cleanup = () => {
      document.body.classList.remove('printing-teacher-card');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    onNotify(`جاري فتح نافذة الطباعة لبطاقة الأستاذ "${card.fullName}"...`, 'info');
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1200);
    }, 80);
  };

  const teacherCandidateUsers = state.registeredUsers.filter(
    (u) =>
      u.role !== 'admin' &&
      !state.admins.some((a) => a.email.toLowerCase() === u.email.toLowerCase()) &&
      !state.teachers.some((t) => t.uid === u.uid)
  );

  const selectedUser = teacherCandidateUsers.find((u) => u.uid === selectedUserUid);
  const maxAdminsReached = state.admins.length >= 3;

  return (
    <section className="surface-panel rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gold-royal flex items-center gap-2">
            <Crown className="w-6 h-6 text-turquoise-400 shrink-0" />
            <span>بوابة مدير المنصة والتحكم المطلق</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            تعديل CCP وبريدي موب، تسعير الأقسام، إضافة الأدمن (3 كأقصى حد) وإدارة الأساتذة، ومراجعة وصلات الدفع.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAdminInfoOpen((prev) => !prev)}
            aria-expanded={adminInfoOpen}
            className={`group px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer ${
              adminInfoOpen
                ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                : 'bg-darknavy hover:bg-gold/15 text-gold-royal border-gold/50 hover:border-gold-royal'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                adminInfoOpen
                  ? 'bg-darknavy/20 text-darknavy'
                  : 'bg-gold/15 text-gold-royal group-hover:bg-gold/25'
              }`}
            >
              <IdCard className="w-4 h-4" />
            </span>
            <span>معلومات الأدمن</span>
          </button>

          <button
            type="button"
            onClick={() => setTeacherCardPanelOpen((prev) => !prev)}
            aria-expanded={teacherCardPanelOpen}
            className={`group px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer ${
              teacherCardPanelOpen
                ? 'turquoise-gradient text-white border-turquoise-300 shadow-[0_0_20px_rgba(20,184,166,0.5)]'
                : 'bg-darknavy hover:bg-turquoise-500/15 text-turquoise-300 border-turquoise-400/50 hover:border-turquoise-300'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                teacherCardPanelOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-turquoise-500/15 text-turquoise-300 group-hover:bg-turquoise-500/25'
              }`}
            >
              <Printer className="w-4 h-4" />
            </span>
            <span>تحميل وطباعة بطاقة الأستاذ</span>
          </button>

          <button
            type="button"
            disabled={isExportingSource}
            onClick={() => void onDownloadSourceCode()}
            className={`group px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 ${
              isExportingSource
                ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                : 'bg-darknavy hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/45 hover:border-emerald-400'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isExportingSource
                  ? 'bg-darknavy/20 text-darknavy'
                  : 'bg-emerald-500/15 text-emerald-300 group-hover:bg-emerald-500/25'
              }`}
            >
              <Code2 className="w-4 h-4" />
            </span>
            <span>
              {isExportingSource ? 'جاري تجهيز ملف ZIP...' : 'تحميل كود التطبيق (ZIP)'}
            </span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>حماية Firebase RBAC مفعّلة</span>
          </span>
        </div>
      </div>

      {/* Expandable Download & Print Teacher Information Card Panel */}
      {teacherCardPanelOpen && (
        <div className="surface-sub p-5 rounded-2xl border-2 border-turquoise-400/55 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-turquoise-300 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-gold-royal shrink-0" />
                <span>تحميل وطباعة بطاقة معلومات الأستاذ</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                اختر الأستاذ لمعاينة بطاقته الرسمية كاملة (الاسم، اللقب، تاريخ الميلاد، مادة التدريس، ورقم CCP) ثم حمّلها أو اطبعها مباشرة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTeacherCardPanelOpen(false)}
              aria-label="إغلاق لوحة بطاقة الأستاذ"
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {teacherCards.length > 0 && activeTeacherCard ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Teacher Selector Column */}
              <div className="lg:col-span-4 space-y-3">
                <label htmlFor="admin-teacher-card-select" className="block text-xs font-bold text-slate-200">
                  اختر الأستاذ ({teacherCards.length})
                </label>
                <select
                  id="admin-teacher-card-select"
                  value={activeTeacherCard.uid}
                  onChange={(e) => setSelectedTeacherCardUid(e.target.value)}
                  className="w-full bg-darknavy border border-turquoise-500/45 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:border-gold focus:outline-none"
                >
                  {teacherCards.map((tc) => (
                    <option key={tc.uid} value={tc.uid}>
                      {tc.fullName} — {tc.subject}
                    </option>
                  ))}
                </select>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pl-1">
                  {teacherCards.map((tc) => {
                    const isSelected = tc.uid === activeTeacherCard.uid;
                    return (
                      <button
                        key={tc.uid}
                        type="button"
                        onClick={() => setSelectedTeacherCardUid(tc.uid)}
                        className={`w-full text-right p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-turquoise-500/20 border-turquoise-400 text-white'
                            : 'bg-darknavy/85 border-slate-800 text-slate-300 hover:border-gold/40'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{tc.fullName}</div>
                          <div className="text-[10px] text-turquoise-300 truncate">{tc.subject}</div>
                        </div>
                        <IdCard className="w-4 h-4 text-gold-royal shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Printable Official Teacher ID Card Preview + Download/Print Buttons */}
              <div className="lg:col-span-8 space-y-4">
                <div className="teacher-card-print-area bg-gradient-to-br from-darknavy via-[#0b2339] to-[#08333f] p-5 sm:p-6 rounded-2xl border-2 border-gold/60 space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between border-b border-gold/30 pb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl royal-gold-gradient text-darknavy flex items-center justify-center shadow">
                        <IdCard className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-turquoise-300 block">
                          منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى · بطاقة الأستاذ الرسمية
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-gold-royal">
                          {activeTeacherCard.fullName}
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs font-black text-darknavy royal-gold-gradient px-3 py-1 rounded-lg">
                      أستاذ معتمد
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-darknavy/85 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">الاسم</span>
                      <strong className="text-white font-bold mt-0.5 block">
                        {activeTeacherCard.firstName || '—'}
                      </strong>
                    </div>
                    <div className="bg-darknavy/85 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">اللقب</span>
                      <strong className="text-white font-bold mt-0.5 block">
                        {activeTeacherCard.lastName || '—'}
                      </strong>
                    </div>
                    <div className="bg-darknavy/85 p-3 rounded-xl border border-turquoise-500/40">
                      <span className="text-[10px] text-turquoise-300 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        مادة التدريس
                      </span>
                      <strong className="text-turquoise-100 font-black mt-0.5 block">
                        {activeTeacherCard.subject || 'غير محددة'}
                      </strong>
                    </div>
                    <div className="bg-darknavy/85 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-turquoise-300" />
                        تاريخ الميلاد
                      </span>
                      <strong className="text-turquoise-200 font-mono font-bold mt-0.5 block tabular-nums" dir="ltr">
                        {activeTeacherCard.birthDate || 'غير محدد'}
                      </strong>
                    </div>
                    <div className="bg-darknavy/85 p-3 rounded-xl border border-gold/40">
                      <span className="text-[10px] text-gold-royal flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        رقم CCP الأستاذ
                      </span>
                      <strong className="text-gold-royal font-mono font-bold mt-0.5 block truncate tabular-nums" dir="ltr">
                        {activeTeacherCard.ccp || 'غير محدد'}
                      </strong>
                    </div>
                    <div className="bg-darknavy/85 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">البريد الإلكتروني</span>
                      <strong className="text-slate-200 font-mono text-[11px] font-bold mt-0.5 block truncate" dir="ltr">
                        {activeTeacherCard.email || '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center text-[11px] text-slate-400 gap-2">
                    <span>الختم الرسمي: إدارة منصة النبراس التعليمية</span>
                    <span className="font-mono tabular-nums" dir="ltr">
                      {new Date().toISOString().slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadTeacherCard(activeTeacherCard)}
                    className="px-4 py-2.5 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 active:scale-95 transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل بطاقة معلومات الأستاذ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintTeacherCard(activeTeacherCard)}
                    className="px-4 py-2.5 turquoise-gradient text-white font-black rounded-xl text-xs shadow hover:brightness-110 active:scale-95 transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة بطاقة معلومات الأستاذ</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">
              لا توجد بطاقات أساتذة مسجلة حالياً.
            </p>
          )}
        </div>
      )}

      {/* Expandable Admin Information Card with dedicated CCP & BaridiMob Button */}
      {adminInfoOpen && (
        <div className="surface-sub p-5 rounded-2xl border-2 border-gold/55 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Live Admin Identity Card Preview */}
            <div className="lg:col-span-5 bg-gradient-to-br from-darknavy via-[#0b2339] to-[#0a3642] p-5 rounded-2xl border border-gold/55 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-gold/25 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl royal-gold-gradient text-darknavy flex items-center justify-center shadow">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-turquoise-300 block">
                      بطاقة معلومات الأدمن · منصة النبراس
                    </span>
                    <h3 className="text-sm font-black text-gold-royal">
                      {adminFirstName || adminLastName
                        ? `${adminFirstName} ${adminLastName}`.trim()
                        : userProfile?.displayName || 'مدير منصة النبراس'}
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gold-royal bg-gold/15 border border-gold/45 px-2.5 py-1 rounded-lg">
                  أدمن معتمد
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">الاسم</span>
                  <strong className="text-white font-bold mt-0.5 block">
                    {adminFirstName || '—'}
                  </strong>
                </div>
                <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">اللقب</span>
                  <strong className="text-white font-bold mt-0.5 block">
                    {adminLastName || '—'}
                  </strong>
                </div>
                <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-turquoise-300" />
                    تاريخ الميلاد
                  </span>
                  <strong className="text-turquoise-200 font-mono font-bold mt-0.5 block tabular-nums" dir="ltr">
                    {adminBirthDate || 'غير محدد'}
                  </strong>
                </div>
                <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">البريد الإلكتروني</span>
                  <strong className="text-slate-200 font-mono text-[11px] font-bold mt-0.5 block truncate" dir="ltr">
                    {userProfile?.email || '—'}
                  </strong>
                </div>
                <div className="bg-darknavy/80 p-2.5 rounded-xl border border-gold/35">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-gold-royal" />
                    رقم CCP الأدمن
                  </span>
                  <strong className="text-gold-royal font-mono font-bold mt-0.5 block truncate tabular-nums" dir="ltr">
                    {adminCardCcp || '—'}
                  </strong>
                </div>
                <div className="bg-darknavy/80 p-2.5 rounded-xl border border-turquoise-500/35">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-turquoise-300" />
                    رقم بريدي موب
                  </span>
                  <strong className="text-turquoise-300 font-mono font-bold mt-0.5 block truncate tabular-nums" dir="ltr">
                    {adminCardBaridi || '—'}
                  </strong>
                </div>
              </div>

              {/* Dedicated CCP & BaridiMob Button Inside Admin Info Icon */}
              <button
                type="button"
                onClick={() => setAdminBankingPanelOpen((prev) => !prev)}
                aria-expanded={adminBankingPanelOpen}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer ${
                  adminBankingPanelOpen
                    ? 'turquoise-gradient text-white border-turquoise-300 shadow-[0_0_18px_rgba(20,184,166,0.5)]'
                    : 'bg-darknavy hover:bg-turquoise-500/15 text-turquoise-300 border-turquoise-400/50 hover:border-turquoise-300'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>
                  {adminBankingPanelOpen
                    ? 'إخفاء إعدادات CCP وبريدي موب'
                    : 'CCP وبريدي موب (عرض وتعديل ونسخ)'}
                </span>
              </button>
            </div>

            {/* Admin Personal Info Form + Toggleable CCP & BaridiMob Panel */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-gold-royal">
                    تحديث بطاقة معلومات الأدمن وحسابات الدفع
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    اضغط على زر «CCP وبريدي موب» لتعديل ونسخ أرقام التحويل البريدي وحفظها سحابياً مباشرة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminInfoOpen(false)}
                  aria-label="إغلاق بطاقة معلومات الأدمن"
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toggleable CCP & BaridiMob Sub-Panel triggered by the button inside Admin Info */}
              {adminBankingPanelOpen && (
                <form
                  onSubmit={(e) => void handleSaveAdminCardBanking(e)}
                  className="bg-darknavy/95 p-4 rounded-2xl border-2 border-turquoise-400/50 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-turquoise-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-gold-royal" />
                      <span>بيانات CCP وبريدي موب الخاصة بالأدمن والمنصة</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setAdminBankingPanelOpen(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      aria-label="إغلاق CCP وبريدي موب"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="admin-card-ccp" className="block text-[11px] font-bold text-gold-royal mb-1">
                        رقم CCP (الحساب البريدي الجاري)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="admin-card-ccp"
                          type="text"
                          maxLength={60}
                          dir="ltr"
                          value={adminCardCcp}
                          onChange={(e) => setAdminCardCcp(e.target.value)}
                          placeholder="0023456789 المفتاح 42"
                          className="w-full bg-slate-900 border border-gold/40 rounded-xl px-3 py-2 text-xs text-gold-royal font-mono font-bold focus:border-gold focus:outline-none text-left"
                        />
                        <button
                          type="button"
                          onClick={() => onCopyText('رقم CCP الأدمن', adminCardCcp)}
                          title="نسخ رقم CCP"
                          className="p-2 rounded-xl bg-gold/15 hover:bg-gold/30 border border-gold/40 text-gold-royal transition cursor-pointer shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-card-baridi" className="block text-[11px] font-bold text-turquoise-300 mb-1">
                        رقم بريدي موب (RIP BaridiMob)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="admin-card-baridi"
                          type="text"
                          maxLength={60}
                          dir="ltr"
                          value={adminCardBaridi}
                          onChange={(e) => setAdminCardBaridi(e.target.value)}
                          placeholder="00799999002345678942"
                          className="w-full bg-slate-900 border border-turquoise-500/40 rounded-xl px-3 py-2 text-xs text-turquoise-300 font-mono font-bold focus:border-turquoise-400 focus:outline-none text-left"
                        />
                        <button
                          type="button"
                          onClick={() => onCopyText('رقم بريدي موب الأدمن', adminCardBaridi)}
                          title="نسخ رقم بريدي موب"
                          className="p-2 rounded-xl bg-turquoise-500/15 hover:bg-turquoise-500/30 border border-turquoise-400/40 text-turquoise-300 transition cursor-pointer shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAdminBanking}
                      className="px-4 py-2 turquoise-gradient text-white font-black rounded-xl text-xs shadow hover:brightness-110 disabled:opacity-60 transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {isSavingAdminBanking
                          ? 'جاري حفظ CCP وبريدي موب...'
                          : 'حفظ CCP وبريدي موب سحابياً'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Admin Personal Details Form */}
              <form
                onSubmit={(e) => void handleSaveAdminCardSubmit(e)}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="adm-first-name" className="block text-xs font-bold text-slate-200 mb-1">
                      الاسم
                    </label>
                    <input
                      id="adm-first-name"
                      type="text"
                      maxLength={60}
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      placeholder="مثال: ليلى"
                      className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="adm-last-name" className="block text-xs font-bold text-slate-200 mb-1">
                      اللقب
                    </label>
                    <input
                      id="adm-last-name"
                      type="text"
                      maxLength={60}
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      placeholder="مثال: المديرة العامة"
                      className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="adm-birth-date" className="block text-xs font-bold text-slate-200 mb-1">
                      تاريخ الميلاد
                    </label>
                    <input
                      id="adm-birth-date"
                      type="date"
                      value={adminBirthDate}
                      onChange={(e) => setAdminBirthDate(e.target.value)}
                      className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-turquoise-200 font-mono focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAdminBankingPanelOpen((prev) => !prev)}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition inline-flex items-center gap-1.5 cursor-pointer ${
                      adminBankingPanelOpen
                        ? 'bg-turquoise-500/20 text-turquoise-200 border-turquoise-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-turquoise-300 border-turquoise-500/40'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>CCP وبريدي موب</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAdminCard}
                    className="px-5 py-2 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 disabled:opacity-60 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingAdminCard ? 'جاري الحفظ...' : 'حفظ بطاقة معلومات الأدمن'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3 Management Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Banking & Teacher Honors */}
        <div className="surface-sub p-5 rounded-2xl border border-gold/30 space-y-5">
          <form onSubmit={(e) => void handleSaveBanking(e)} className="space-y-3">
            <h3 className="font-bold text-gold-royal text-sm border-b border-slate-700/70 pb-2">
              إدراج وتغيير CCP وبريدي موب الإدارة
            </h3>
            <div>
              <label htmlFor="adm-ccp" className="block text-xs font-bold text-slate-200 mb-1">
                رقم CCP الإدارة (الحساب البريدي الجاري)
              </label>
              <input
                id="adm-ccp"
                type="text"
                maxLength={60}
                value={ccpInput}
                onChange={(e) => setCcpInput(e.target.value)}
                className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-gold-royal font-mono font-bold focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="adm-baridi" className="block text-xs font-bold text-slate-200 mb-1">
                رقم بريدي موب الإدارة (RIP BaridiMob)
              </label>
              <input
                id="adm-baridi"
                type="text"
                maxLength={60}
                value={baridiInput}
                onChange={(e) => setBaridiInput(e.target.value)}
                className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-turquoise-300 font-mono font-bold focus:border-turquoise-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ وتحديث بيانات الدفع سحابياً</span>
            </button>
          </form>

          <form
            onSubmit={(e) => void handleHonorSubmit(e)}
            className="pt-4 border-t border-slate-800 space-y-2.5"
          >
            <h4 className="font-bold text-gold-royal text-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>تكريم المدير للأساتذة</span>
            </h4>
            <input
              type="text"
              maxLength={100}
              value={honorTeacher}
              onChange={(e) => setHonorTeacher(e.target.value)}
              placeholder="اسم الأستاذ المراد تكريمه"
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 turquoise-gradient text-white font-bold rounded-xl text-xs shadow cursor-pointer hover:brightness-110 transition"
            >
              إصدار شهادة شرف وتقدير للأستاذ
            </button>
          </form>
        </div>

        {/* Column 2: Monthly & Annual Prices */}
        <div className="surface-sub p-5 rounded-2xl space-y-5">
          <form onSubmit={(e) => void handlePricesSubmit(e)} className="space-y-3">
            <h3 className="font-bold text-turquoise-300 text-sm border-b border-slate-700/70 pb-2">
              أسعار الأقسام الثلاثة (شهري وسنوي - دج)
            </h3>

            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-200">
                1. القسم الخاص الفردي (1 تلميذ)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="adm-p1" className="block text-[10px] text-turquoise-300 mb-1">
                    شهري (دج)
                  </label>
                  <input
                    id="adm-p1"
                    type="number"
                    min={0}
                    max={500000}
                    value={pricePrivate}
                    onChange={(e) => setPricePrivate(e.target.value)}
                    className="w-full bg-darknavy border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:border-turquoise-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="adm-a1" className="block text-[10px] text-gold-royal mb-1">
                    سنوي (دج)
                  </label>
                  <input
                    id="adm-a1"
                    type="number"
                    min={0}
                    max={5000000}
                    value={annualPrivate}
                    onChange={(e) => setAnnualPrivate(e.target.value)}
                    className="w-full bg-darknavy border border-gold/40 rounded-xl px-2.5 py-2 text-xs text-gold-royal font-mono font-bold tabular-nums focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-200">
                2. قسم المجموعة (8 إلى 10 تلاميذ)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="adm-p2" className="block text-[10px] text-turquoise-300 mb-1">
                    شهري (دج)
                  </label>
                  <input
                    id="adm-p2"
                    type="number"
                    min={0}
                    max={500000}
                    value={priceSmall}
                    onChange={(e) => setPriceSmall(e.target.value)}
                    className="w-full bg-darknavy border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:border-turquoise-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="adm-a2" className="block text-[10px] text-gold-royal mb-1">
                    سنوي (دج)
                  </label>
                  <input
                    id="adm-a2"
                    type="number"
                    min={0}
                    max={5000000}
                    value={annualSmall}
                    onChange={(e) => setAnnualSmall(e.target.value)}
                    className="w-full bg-darknavy border border-gold/40 rounded-xl px-2.5 py-2 text-xs text-gold-royal font-mono font-bold tabular-nums focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-200">
                3. القسم الجماعي (عدد غير محدود)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="adm-p3" className="block text-[10px] text-turquoise-300 mb-1">
                    شهري (دج)
                  </label>
                  <input
                    id="adm-p3"
                    type="number"
                    min={0}
                    max={500000}
                    value={priceGroup}
                    onChange={(e) => setPriceGroup(e.target.value)}
                    className="w-full bg-darknavy border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:border-turquoise-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="adm-a3" className="block text-[10px] text-gold-royal mb-1">
                    سنوي (دج)
                  </label>
                  <input
                    id="adm-a3"
                    type="number"
                    min={0}
                    max={5000000}
                    value={annualGroup}
                    onChange={(e) => setAnnualGroup(e.target.value)}
                    className="w-full bg-darknavy border border-gold/40 rounded-xl px-2.5 py-2 text-xs text-gold-royal font-mono font-bold tabular-nums focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 turquoise-gradient text-white font-bold rounded-xl text-xs shadow cursor-pointer hover:brightness-110 transition"
            >
              تطبيق الأسعار الشهرية والسنوية فوراً
            </button>
          </form>

          {/* Pending Teacher Payouts Moderation */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <h4 className="font-bold text-gold-royal text-xs">
              طلبات سحب أرباح الأساتذة ({state.payouts.length})
            </h4>
            {state.payouts.length === 0 ? (
              <p className="text-[11px] text-slate-400">لا توجد طلبات سحب معلقة حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pl-1">
                {state.payouts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-darknavy/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {p.teacherName} ·{' '}
                        <span className="text-gold-royal tabular-nums">{formatDzd(p.amount)}</span>
                      </div>
                      <div className="text-slate-400 font-mono truncate" dir="ltr">
                        CCP: {p.ccp}
                      </div>
                    </div>
                    {p.status === 'تم التحويل' ? (
                      <span className="text-emerald-400 font-bold shrink-0">تم التحويل</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onCompletePayout(p.id)}
                        className="px-2.5 py-1 bg-emerald-600/25 hover:bg-emerald-600/45 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold cursor-pointer shrink-0"
                      >
                        تأكيد التحويل
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Independent Admins (Strict Max 3) + Trusted Teachers */}
        <div className="surface-sub p-5 rounded-2xl flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700/70 pb-2 gap-2">
              <h3 className="font-bold text-turquoise-300 text-sm flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-gold-royal shrink-0" />
                <span>فريق الأدمن (3 كأقصى حد)</span>
              </h3>
              <span
                className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-lg border ${
                  maxAdminsReached
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-gold/10 text-gold-royal border-gold/35'
                }`}
              >
                {state.admins.length} / 3 أدمن
              </span>
            </div>

            {/* 3 Admin Slot Indicator Bar */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
              {[0, 1, 2].map((slotIdx) => {
                const occupied = Boolean(state.admins[slotIdx]);
                return (
                  <div
                    key={slotIdx}
                    className={`py-1 px-1.5 rounded-lg border ${
                      occupied
                        ? 'bg-gold/15 border-gold/45 text-gold-royal'
                        : 'bg-darknavy/70 border-slate-800 text-slate-500'
                    }`}
                  >
                    {slotIdx === 0
                      ? 'أدمن 1 (المديرة)'
                      : occupied
                      ? `أدمن ${slotIdx + 1} (مشغول)`
                      : `مقعد ${slotIdx + 1} متاح`}
                  </div>
                );
              })}
            </div>

            {/* Dedicated Add Admin Button (Independent from Teachers) */}
            <button
              type="button"
              disabled={maxAdminsReached}
              onClick={() => setAddAdminOpen((prev) => !prev)}
              aria-expanded={addAdminOpen}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 border transition-all duration-200 active:scale-95 ${
                maxAdminsReached
                  ? 'bg-slate-800/70 text-slate-400 border-slate-700 cursor-not-allowed opacity-70'
                  : addAdminOpen
                  ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_16px_rgba(255,215,0,0.45)] cursor-pointer'
                  : 'bg-darknavy hover:bg-gold/15 text-gold-royal border-gold/55 hover:border-gold-royal cursor-pointer'
              }`}
            >
              <Crown className="w-4 h-4 shrink-0" />
              <span>
                {maxAdminsReached
                  ? 'تم بلوغ الحد الأقصى (3 / 3 أدمن)'
                  : addAdminOpen
                  ? 'إغلاق نموذج إضافة أدمن'
                  : 'إضافة أدمن جديد'}
              </span>
            </button>

            {/* Inline Independent Add Admin Form */}
            {addAdminOpen && !maxAdminsReached && (
              <form
                onSubmit={(e) => void handleAddAdminSubmit(e)}
                className="bg-darknavy/95 p-3.5 rounded-xl border border-gold/45 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-gold-royal">
                    إضافة حساب أدمن مستقل (وليس ترقية أستاذ)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddAdminOpen(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="إغلاق"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label htmlFor="new-admin-name" className="block text-[11px] font-bold text-slate-300 mb-1">
                    اسم الأدمن الجديد
                  </label>
                  <input
                    id="new-admin-name"
                    type="text"
                    required
                    maxLength={100}
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="مثال: سارة بن يوسف"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-admin-email" className="block text-[11px] font-bold text-slate-300 mb-1">
                    البريد الإلكتروني (حساب Google للأدمن)
                  </label>
                  <input
                    id="new-admin-email"
                    type="email"
                    required
                    maxLength={120}
                    dir="ltr"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin.name@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-turquoise-200 font-mono focus:border-gold focus:outline-none text-left"
                  />
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  يُمنح هذا الحساب صلاحية الأدمن مباشرةً عند تسجيل الدخول بـ Google، بحد أقصى 3 أدمن في كامل المنصة.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAddAdminOpen(false);
                      setNewAdminName('');
                      setNewAdminEmail('');
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingAdmin}
                    className="py-2 royal-gold-gradient text-darknavy font-black rounded-lg text-[11px] shadow hover:brightness-105 disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingAdmin ? 'جاري الإضافة...' : 'تأكيد إضافة الأدمن'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Current Admins List */}
            <div className="space-y-2 max-h-36 overflow-y-auto pl-1">
              {state.admins.map((adm) => (
                <div
                  key={adm.id}
                  className="bg-darknavy/90 p-2.5 rounded-xl border border-gold/25 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{adm.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                      {adm.email}
                    </div>
                  </div>
                  {adm.isPrimary ? (
                    <span className="text-[10px] font-bold text-gold-royal shrink-0">مديرة</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void onRemoveAdmin(adm.id)}
                      title="إزالة الأدمن"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {state.teachers.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-turquoise-300 block">
                  الأساتذة المعتمدون ({state.teachers.length})
                </span>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pl-1">
                  {state.teachers.map((t) => (
                    <div
                      key={t.id}
                      className="bg-darknavy/90 px-2.5 py-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="text-slate-200 font-semibold truncate">
                        {t.name} · {t.subject}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacherCardUid(t.uid);
                            setTeacherCardPanelOpen(true);
                          }}
                          title="معاينة وتحميل وطباعة بطاقة الأستاذ"
                          className="p-1 rounded-md bg-turquoise-500/15 hover:bg-turquoise-500/30 border border-turquoise-400/40 text-turquoise-300 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onRemoveTeacher(t.id)}
                          title="سحب صلاحية الأستاذ"
                          className="text-rose-400 hover:text-rose-300 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Appoint Registered User as Teacher ONLY (No Admin Promotion) */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <label htmlFor="adm-select-user" className="block text-[11px] font-bold text-turquoise-300">
              تعيين أستاذ معتمد (خاص بالأساتذة فقط):
            </label>
            <select
              id="adm-select-user"
              value={selectedUserUid}
              onChange={(e) => setSelectedUserUid(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-turquoise-400 focus:outline-none"
            >
              <option value="">اختر حساباً مسجلاً لتعيينه كأستاذ...</option>
              {teacherCandidateUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName} ({u.email}) — {u.role}
                </option>
              ))}
            </select>

            <select
              value={teacherSubject}
              onChange={(e) => setTeacherSubject(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-turquoise-400 focus:outline-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  مادة الأستاذ: {s}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedUser}
              onClick={() => {
                if (selectedUser) {
                  void onPromoteUserToTeacher(selectedUser, teacherSubject);
                  setSelectedUserUid('');
                }
              }}
              className="w-full py-2.5 bg-turquoise-700/30 hover:bg-turquoise-700/50 disabled:opacity-45 text-turquoise-200 font-bold rounded-xl text-xs border border-turquoise-400/40 transition cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>تعيين كأستاذ معتمد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Receipts Review & Configurable Revenue Split */}
      <div className="surface-sub p-5 sm:p-6 rounded-2xl border border-gold/40 space-y-4">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-4 gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gold-royal">
              مراجعة وصلات الدفع وتفعيل الاشتراكات الواردة
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              عند اعتماد أي وصل، يُفعَّل اشتراك التلميذ فوراً في قاعدة البيانات وتُوزّع المبالغ آلياً:{' '}
              <strong className="text-turquoise-300 tabular-nums">
                {state.platformSharePct}% لخزينة المنصة
              </strong>{' '}
              و
              <strong className="text-gold-royal tabular-nums">
                {' '}
                {state.teacherSharePct}% كرصيد مؤكد للأستاذ
              </strong>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-darknavy px-4 py-2.5 rounded-xl border border-turquoise-500/40">
              <span className="text-slate-400 block text-[10px]">
                خزينة المنصة الصافية ({state.platformSharePct}%)
              </span>
              <strong className="text-turquoise-300 font-black text-sm tabular-nums">
                {formatDzd(platformShareAmount)}
              </strong>
            </div>
            <div className="bg-darknavy px-4 py-2.5 rounded-xl border border-gold/45">
              <span className="text-slate-400 block text-[10px]">
                رصيد أرباح الأستاذ المؤكدة ({state.teacherSharePct}%)
              </span>
              <strong className="text-gold-royal font-black text-sm tabular-nums">
                {formatDzd(teacherShareAmount)}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setSplitEditorOpen((prev) => !prev)}
              aria-expanded={splitEditorOpen}
              className={`px-4 py-3 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer ${
                splitEditorOpen
                  ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_18px_rgba(255,215,0,0.45)]'
                  : 'bg-darknavy hover:bg-gold/15 text-gold-royal border-gold/50 hover:border-gold-royal'
              }`}
            >
              <Percent className="w-4 h-4 shrink-0" />
              <span>تغيير نسبة المنصة والأستاذ</span>
            </button>
          </div>
        </div>

        {/* Toggleable Revenue Split Percentage Editor */}
        {splitEditorOpen && (
          <form
            onSubmit={(e) => void handleSaveSplitSubmit(e)}
            className="bg-darknavy/95 p-4 sm:p-5 rounded-2xl border border-gold/50 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-gold-royal flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-turquoise-400" />
                  <span>تعديل نسبة مبلغ المنصة ونسبة مبلغ الأستاذ</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  يتكامل العدّادان تلقائياً ليظل المجموع دائماً 100% وتُطبَّق النسب فوراً في السحابة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSplitEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="إغلاق تعديل النسب"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">نسب جاهزة سريعة:</span>
              {[
                { p: 70, t: 30 },
                { p: 60, t: 40 },
                { p: 50, t: 50 },
                { p: 80, t: 20 },
                { p: 40, t: 60 },
              ].map((preset) => {
                const isActive =
                  platformPctInput === preset.p && teacherPctInput === preset.t;
                return (
                  <button
                    key={`${preset.p}-${preset.t}`}
                    type="button"
                    onClick={() => handlePlatformPctChange(preset.p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all duration-150 active:scale-95 cursor-pointer tabular-nums ${
                      isActive
                        ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-turquoise-400/60 hover:text-turquoise-200'
                    }`}
                  >
                    منصة {preset.p}% / أستاذ {preset.t}%
                  </button>
                );
              })}
            </div>

            {/* Inputs & Synchronized Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-turquoise-500/35 space-y-2">
                <label
                  htmlFor="adm-platform-pct"
                  className="flex justify-between items-center text-xs font-bold text-turquoise-300"
                >
                  <span>نسبة مبلغ المنصة (%)</span>
                  <span className="font-mono text-sm tabular-nums">{platformPctInput}%</span>
                </label>
                <input
                  id="adm-platform-pct"
                  type="number"
                  min={0}
                  max={100}
                  value={platformPctInput}
                  onChange={(e) => handlePlatformPctChange(Number(e.target.value))}
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-sm text-turquoise-300 font-mono font-black tabular-nums focus:border-turquoise-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-gold/35 space-y-2">
                <label
                  htmlFor="adm-teacher-pct"
                  className="flex justify-between items-center text-xs font-bold text-gold-royal"
                >
                  <span>نسبة مبلغ الأستاذ (%)</span>
                  <span className="font-mono text-sm tabular-nums">{teacherPctInput}%</span>
                </label>
                <input
                  id="adm-teacher-pct"
                  type="number"
                  min={0}
                  max={100}
                  value={teacherPctInput}
                  onChange={(e) => handleTeacherPctChange(Number(e.target.value))}
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-sm text-gold-royal font-mono font-black tabular-nums focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={100}
                value={platformPctInput}
                onChange={(e) => handlePlatformPctChange(Number(e.target.value))}
                aria-label="شريط توزيع النسبة بين المنصة والأستاذ"
                className="w-full accent-gold cursor-pointer"
              />
              <div className="w-full h-3 rounded-full overflow-hidden flex border border-slate-700">
                <div
                  className="h-full turquoise-gradient transition-all duration-200"
                  style={{ width: `${platformPctInput}%` }}
                  title={`نسبة المنصة ${platformPctInput}%`}
                />
                <div
                  className="h-full royal-gold-gradient transition-all duration-200"
                  style={{ width: `${teacherPctInput}%` }}
                  title={`نسبة الأستاذ ${teacherPctInput}%`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-300 tabular-nums">
                المجموع:{' '}
                <strong className="text-emerald-400 font-black">
                  {platformPctInput + teacherPctInput}%
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlatformPctInput(state.platformSharePct);
                    setTeacherPctInput(state.teacherSharePct);
                    setSplitEditorOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingSplit}
                  className="px-5 py-2 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 disabled:opacity-60 transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingSplit ? 'جاري الحفظ...' : 'حفظ وتطبيق النسب الجديدة'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-darknavy/80 p-1.5 rounded-xl border border-slate-800 w-fit">
          {(
            [
              { id: 'all', label: `الكل (${counts.all})` },
              { id: 'pending', label: `قيد المراجعة (${counts.pending})` },
              { id: 'approved', label: `معتمد (${counts.approved})` },
              { id: 'rejected', label: `مرفوض (${counts.rejected})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setReceiptFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                receiptFilter === f.id
                  ? 'royal-gold-gradient text-darknavy'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Receipts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-darknavy text-gold-royal border-b border-gold/30">
                <th className="p-3 rounded-tr-xl font-bold whitespace-nowrap">اسم التلميذ</th>
                <th className="p-3 font-bold whitespace-nowrap">المستوى / الشعبة / المادة</th>
                <th className="p-3 font-bold whitespace-nowrap">نوع القسم</th>
                <th className="p-3 font-bold whitespace-nowrap">المبلغ</th>
                <th className="p-3 font-bold whitespace-nowrap">الطريقة والمرجع</th>
                <th className="p-3 font-bold whitespace-nowrap">صورة الوصل</th>
                <th className="p-3 font-bold whitespace-nowrap">الحالة</th>
                <th className="p-3 rounded-tl-xl font-bold text-center whitespace-nowrap">
                  إجراء الإدارة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/90">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    لا توجد وصلات دفع ضمن هذا التصنيف حالياً.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/35 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white whitespace-nowrap">{rec.studentName}</div>
                      <div className="text-[10px] text-slate-400">
                        {rec.submittedBy} · {rec.date}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-200 font-semibold">{rec.level}</div>
                      <div className="text-[11px] text-slate-400">
                        {rec.stream} · {rec.subject}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      {rec.sectionType.split('(')[0].trim()}
                    </td>
                    <td className="p-3 font-black text-gold-royal tabular-nums whitespace-nowrap">
                      {formatDzd(rec.amount)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-turquoise-300 font-bold">{rec.method}</div>
                      <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                        {rec.ref}
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onPreviewReceipt(rec)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-darknavy hover:border-gold border border-slate-700 rounded-lg text-turquoise-300 hover:text-gold-royal font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة الوصل</span>
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {rec.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> معتمد ومفعّل
                        </span>
                      )}
                      {rec.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                          <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                        </span>
                      )}
                      {rec.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> مرفوض
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {rec.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => void onUpdateReceiptStatus(rec.id, 'approved')}
                            className="px-2.5 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/45 text-emerald-300 border border-emerald-500/45 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>اعتماد وتفعيل</span>
                          </button>
                        )}
                        {rec.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => void onUpdateReceiptStatus(rec.id, 'rejected')}
                            className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
