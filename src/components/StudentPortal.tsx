import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  IdCard,
  Lock,
  MessageCircle,
  Phone,
  Save,
  Send,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  BillingCycle,
  Certificate,
  Lesson,
  PaymentMethod,
  PaymentReceipt,
  PlatformState,
  SectionType,
  UserProfile,
} from '../types';
import {
  LEVELS,
  LEVEL_STREAMS,
  SECTION_TYPES,
  SUBJECTS,
  WHATSAPP_NUMBER_DISPLAY,
  buildWhatsAppLink,
  formatDzd,
  triggerDocumentDownload,
} from '../data/initialData';
import { compressReceiptImage } from '../firebase';

interface StudentPortalProps {
  state: PlatformState;
  userProfile: UserProfile | null;
  defaultStudentName: string;
  onSelectSection: (section: SectionType, cycle?: BillingCycle) => void;
  onSelectBillingCycle: (cycle: BillingCycle) => void;
  onSaveStudentCard: (card: {
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
    level: string;
    stream: string;
  }) => Promise<void>;
  onEnroll: () => Promise<void> | void;
  onSubmitReceipt: (payload: {
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
  }) => Promise<void>;
  onPreviewReceipt: (receipt: PaymentReceipt) => void;
  onPreviewCertificate: (cert: Certificate) => void;
  onNotify: (text: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  state,
  userProfile,
  defaultStudentName,
  onSelectSection,
  onSelectBillingCycle,
  onSaveStudentCard,
  onEnroll,
  onSubmitReceipt,
  onPreviewReceipt,
  onPreviewCertificate,
  onNotify,
}) => {
  const [level, setLevel] = useState<string>(userProfile?.level || 'السنة الثالثة ثانوي');
  const [stream, setStream] = useState<string>(
    userProfile?.stream || LEVEL_STREAMS[userProfile?.level || 'السنة الثالثة ثانوي']?.[0] || 'عام'
  );
  const [subject, setSubject] = useState<string>('الكل');

  const [studentCardOpen, setStudentCardOpen] = useState<boolean>(false);
  const [stuFirstName, setStuFirstName] = useState<string>(
    userProfile?.firstName || defaultStudentName?.split(' ')[0] || ''
  );
  const [stuLastName, setStuLastName] = useState<string>(
    userProfile?.lastName || defaultStudentName?.split(' ').slice(1).join(' ') || ''
  );
  const [stuBirthDate, setStuBirthDate] = useState<string>(userProfile?.birthDate || '');
  const [stuPhone, setStuPhone] = useState<string>(userProfile?.phone || '');
  const [isSavingCard, setIsSavingCard] = useState<boolean>(false);

  const [studentName, setStudentName] = useState<string>(defaultStudentName || 'تلميذ النبراس');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BaridiMob');
  const [payRef, setPayRef] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (userProfile?.firstName !== undefined) setStuFirstName(userProfile.firstName);
    if (userProfile?.lastName !== undefined) setStuLastName(userProfile.lastName);
    if (userProfile?.birthDate !== undefined) setStuBirthDate(userProfile.birthDate);
    if (userProfile?.phone !== undefined) setStuPhone(userProfile.phone);
    if (userProfile?.firstName || userProfile?.lastName) {
      setStudentName(`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim());
    }
  }, [userProfile]);

  const availableStreams = LEVEL_STREAMS[level] ?? ['عام'];
  const activePrice =
    state.billingCycle === 'annual'
      ? state.annualPrices[state.activeSection]
      : state.prices[state.activeSection];
  const activeMeta = state.sectionsMeta[state.activeSection];

  const handleLevelChange = (nextLevel: string) => {
    setLevel(nextLevel);
    const nextStreams = LEVEL_STREAMS[nextLevel] ?? ['عام'];
    setStream(nextStreams[0]);
  };

  const filteredLessons = useMemo(() => {
    return state.lessons.filter(
      (lesson) => lesson.level === level && (subject === 'الكل' || lesson.subject === subject)
    );
  }, [state.lessons, level, subject]);

  const studentReceipts = useMemo(() => state.receipts.slice(0, 6), [state.receipts]);
  const latestOwnReceipt = studentReceipts[0];

  const studentCertificates = useMemo(
    () => state.certificates.filter((c) => c.recipientRole === 'تلميذ'),
    [state.certificates]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.slice(0, 140));
    const compressed = await compressReceiptImage(file);
    setPreviewUrl(compressed.previewUrl);
    setIsPdf(compressed.isPdf);
  };

  const clearFile = () => {
    setPreviewUrl('');
    setFileName('');
    setIsPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim().slice(0, 100);
    const cleanRef = payRef.trim().slice(0, 60);
    if (!cleanName) {
      onNotify('يرجى إدخال اسم التلميذ الكامل قبل إرسال الوصل.', 'warning');
      return;
    }
    if (cleanRef.length < 2) {
      onNotify('يرجى إدخال رقم العملية أو المرجع الموجود في وصل الدفع.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitReceipt({
        studentName: cleanName,
        submittedBy: 'تلميذ',
        level,
        stream,
        subject: subject === 'الكل' ? 'جميع المواد' : subject,
        sectionType: state.activeSection,
        amount: activePrice,
        method: payMethod,
        ref: cleanRef,
        fileName: (fileName || `وصل_${cleanRef}.jpg`).slice(0, 160),
        previewUrl,
        isPdf,
      });
      setPayRef('');
      clearFile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLessonDownload = (lesson: Lesson) => {
    if (!lesson.allowDownload) {
      onNotify('قام الأستاذ بتعطيل تحميل هذه الوثيقة حالياً.', 'warning');
      return;
    }
    triggerDocumentDownload(lesson.fileName, [
      `منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى`,
      `====================================`,
      `عنوان الدرس: ${lesson.title}`,
      `المستوى: ${lesson.level} - ${lesson.stream}`,
      `المادة: ${lesson.subject}`,
      `وسيلة البث: ${lesson.method}`,
      `الرابط: ${lesson.link}`,
      `اسم الملف المرفق: ${lesson.fileName}`,
    ]);
    onNotify(`تم بدء تحميل الوثيقة: ${lesson.fileName}`, 'success');
  };

  const renderSubscriptionStatus = () => {
    if (!latestOwnReceipt) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Clock className="w-4 h-4" />
          حالة الاشتراك: بانتظار الوصل
        </span>
      );
    }
    if (latestOwnReceipt.status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          حالة الاشتراك: مفعّل ومعتمد
        </span>
      );
    }
    if (latestOwnReceipt.status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300">
          <XCircle className="w-4 h-4" />
          حالة الاشتراك: الوصل مرفوض — يرجى إعادة الإرسال
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
        <Clock className="w-4 h-4" />
        حالة الاشتراك: قيد المراجعة الإدارية
      </span>
    );
  };

  const whatsappDirectMsg = `السلام عليكم إدارة منصة النبراس التعليمية، أنا التلميذ ${studentName || 'مسجل جديد'} (${level} - ${state.activeSection}) أرغب في تأكيد التسجيل أو إرسال وصل الدفع.`;

  const handleSaveStudentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = stuFirstName.trim().slice(0, 60);
    const cleanLast = stuLastName.trim().slice(0, 60);
    if (!cleanFirst || !cleanLast) {
      onNotify('يرجى إدخال اسم ولقب التلميذ لحفظ البطاقة.', 'warning');
      return;
    }
    if (!stuBirthDate.trim()) {
      onNotify('يرجى تحديد تاريخ ميلاد التلميذ.', 'warning');
      return;
    }
    setIsSavingCard(true);
    try {
      await onSaveStudentCard({
        firstName: cleanFirst,
        lastName: cleanLast,
        birthDate: stuBirthDate.trim().slice(0, 20),
        phone: stuPhone.trim().slice(0, 30),
        level,
        stream,
      });
      setStudentName(`${cleanFirst} ${cleanLast}`.trim());
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
    <section className="surface-panel rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gold-royal flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-turquoise-400 shrink-0" />
            <span>بوابة التلاميذ الذكية</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            اختر المستوى الدراسي، الشعبة، المادة ونوع القسم لحساب السعر آلياً ومتابعة الدروس والوثائق.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setStudentCardOpen((prev) => !prev)}
            aria-expanded={studentCardOpen}
            className={`group px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer ${
              studentCardOpen
                ? 'bg-emerald-400 text-darknavy border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                : 'bg-darknavy hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/45 hover:border-emerald-400'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                studentCardOpen
                  ? 'bg-darknavy/20 text-darknavy'
                  : 'bg-emerald-500/15 text-emerald-300 group-hover:bg-emerald-500/25'
              }`}
            >
              <IdCard className="w-4 h-4" />
            </span>
            <span>بطاقة معلومات التلميذ</span>
          </button>

          <div className="text-xs font-semibold text-emerald-300">
            {filteredLessons.length} دروس متاحة
          </div>
        </div>
      </div>

      {/* Expandable Student ID Card & Editor */}
      {studentCardOpen && (
        <div className="surface-sub p-5 rounded-2xl border-2 border-emerald-400/50 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Live Student ID Card Preview */}
          <div className="lg:col-span-5 bg-gradient-to-br from-darknavy via-[#0b2738] to-[#083834] p-5 rounded-2xl border border-emerald-400/50 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-emerald-400/25 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 text-darknavy flex items-center justify-center shadow">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-300 block">
                    بطاقة التلميذ الرقمية · منصة النبراس
                  </span>
                  <h3 className="text-sm font-black text-white">
                    {stuFirstName || stuLastName
                      ? `${stuFirstName} ${stuLastName}`.trim()
                      : studentName || 'تلميذ منصة النبراس'}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-black text-gold-royal bg-gold/15 border border-gold/40 px-2.5 py-1 rounded-lg">
                تلميذ مسجل
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الاسم</span>
                <strong className="text-white font-bold mt-0.5 block">
                  {stuFirstName || '—'}
                </strong>
              </div>
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">اللقب</span>
                <strong className="text-white font-bold mt-0.5 block">
                  {stuLastName || '—'}
                </strong>
              </div>
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-turquoise-300" />
                  تاريخ الميلاد
                </span>
                <strong className="text-turquoise-200 font-mono font-bold mt-0.5 block tabular-nums" dir="ltr">
                  {stuBirthDate || 'غير محدد'}
                </strong>
              </div>
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  هاتف التواصل / الولي
                </span>
                <strong className="text-emerald-300 font-mono font-bold mt-0.5 block tabular-nums" dir="ltr">
                  {stuPhone || 'غير محدد'}
                </strong>
              </div>
              <div className="col-span-2 bg-darknavy/80 p-2.5 rounded-xl border border-gold/30">
                <span className="text-[10px] text-slate-400 block">المستوى والشعبة الدراسية</span>
                <strong className="text-gold-royal font-bold mt-0.5 block">
                  {level} — {stream}
                </strong>
              </div>
            </div>
          </div>

          {/* Student Card Edit Form */}
          <form
            onSubmit={(e) => void handleSaveStudentInfo(e)}
            className="lg:col-span-7 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-emerald-300">
                  ملء وتحديث بطاقة معلومات التلميذ
                </h3>
                <p className="text-[11px] text-slate-400">
                  تُحفظ معلوماتك بشكل خاص في السحابة وتُستخدم تلقائياً عند إرسال وصلات الدفع وإصدار الشهادات.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentCardOpen(false)}
                aria-label="إغلاق بطاقة معلومات التلميذ"
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="stu-card-first" className="block text-xs font-bold text-slate-200 mb-1">
                  الاسم
                </label>
                <input
                  id="stu-card-first"
                  type="text"
                  maxLength={60}
                  value={stuFirstName}
                  onChange={(e) => setStuFirstName(e.target.value)}
                  placeholder="مثال: محمد أمين"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="stu-card-last" className="block text-xs font-bold text-slate-200 mb-1">
                  اللقب
                </label>
                <input
                  id="stu-card-last"
                  type="text"
                  maxLength={60}
                  value={stuLastName}
                  onChange={(e) => setStuLastName(e.target.value)}
                  placeholder="مثال: بن علي"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="stu-card-birth" className="block text-xs font-bold text-slate-200 mb-1">
                  تاريخ الميلاد
                </label>
                <input
                  id="stu-card-birth"
                  type="date"
                  value={stuBirthDate}
                  onChange={(e) => setStuBirthDate(e.target.value)}
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-turquoise-200 font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="stu-card-phone" className="block text-xs font-bold text-slate-200 mb-1">
                  رقم الهاتف / ولي الأمر
                </label>
                <input
                  id="stu-card-phone"
                  type="tel"
                  maxLength={30}
                  value={stuPhone}
                  onChange={(e) => setStuPhone(e.target.value)}
                  placeholder="مثال: 0550123456"
                  dir="ltr"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono text-right focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingCard}
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-darknavy font-black rounded-xl text-xs shadow disabled:opacity-60 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingCard ? 'جاري الحفظ...' : 'حفظ بطاقة معلومات التلميذ'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Control Panel */}
        <div className="lg:col-span-4 surface-sub p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-turquoise-300 text-sm border-b border-slate-700/70 pb-2.5">
            تحديد المسار الدراسي ونوع القسم
          </h3>

          <div>
            <label htmlFor="stu-level" className="block text-xs font-bold text-slate-200 mb-1.5">
              1. المستوى الدراسي (التحضيري إلى البكالوريا)
            </label>
            <select
              id="stu-level"
              value={level}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stu-stream" className="block text-xs font-bold text-slate-200 mb-1.5">
              2. الشعبة الدراسية (جميع الشعب)
            </label>
            <select
              id="stu-stream"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
            >
              {availableStreams.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stu-subject" className="block text-xs font-bold text-slate-200 mb-1.5">
              3. المادة الدراسية (جميع المواد متاحة)
            </label>
            <select
              id="stu-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
            >
              <option value="الكل">جميع المواد الدراسية</option>
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="stu-section" className="block text-xs font-bold text-slate-200 mb-1.5">
              4. نوع القسم المطلوب
            </label>
            <select
              id="stu-section"
              value={state.activeSection}
              onChange={(e) => onSelectSection(e.target.value as SectionType)}
              className="w-full bg-darknavy border border-gold/60 rounded-xl px-3 py-2.5 text-xs text-gold-royal font-bold focus:border-gold focus:outline-none"
            >
              {SECTION_TYPES.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-200 mb-1.5">
              5. مدة الاشتراك (شهري أو سنوي)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectBillingCycle('monthly')}
                className={`py-2 px-3 rounded-xl text-xs font-black border transition-all duration-150 active:scale-95 cursor-pointer ${
                  state.billingCycle === 'monthly'
                    ? 'turquoise-gradient text-white border-turquoise-400'
                    : 'bg-darknavy text-slate-300 border-slate-700 hover:border-turquoise-400/60'
                }`}
              >
                شهري ({formatDzd(state.prices[state.activeSection])})
              </button>
              <button
                type="button"
                onClick={() => onSelectBillingCycle('annual')}
                className={`py-2 px-3 rounded-xl text-xs font-black border transition-all duration-150 active:scale-95 cursor-pointer ${
                  state.billingCycle === 'annual'
                    ? 'royal-gold-gradient text-darknavy border-gold-royal'
                    : 'bg-darknavy text-gold-royal border-gold/40 hover:border-gold-royal'
                }`}
              >
                سنوي ({formatDzd(state.annualPrices[state.activeSection])})
              </button>
            </div>
          </div>

          <div className="bg-darknavy/95 p-4 rounded-xl border border-gold/45 text-center space-y-2">
            <span className="text-[11px] text-turquoise-300 font-bold block">
              نظام القسم: {activeMeta.desc} ·{' '}
              {state.billingCycle === 'annual' ? 'اشتراك سنوي' : 'اشتراك شهري'}
            </span>
            <div className="text-2xl font-black text-gold-royal tabular-nums">
              {formatDzd(activePrice)}
            </div>
            <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800 space-y-1">
              <p>
                CCP الإدارة:{' '}
                <strong className="text-gold-royal font-mono tabular-nums" dir="ltr">
                  {state.ccp}
                </strong>
              </p>
              <p>
                بريدي موب:{' '}
                <strong className="text-turquoise-300 font-mono tabular-nums" dir="ltr">
                  {state.baridi}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onEnroll()}
            className="w-full py-3 px-4 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow-lg hover:brightness-105 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد التسجيل في هذا القسم</span>
          </button>

          <a
            href={buildWhatsAppLink(whatsappDirectMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/45 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>
              تواصل مباشر عبر واتساب الإدارة:{' '}
              <span dir="ltr" className="font-mono">
                {WHATSAPP_NUMBER_DISPLAY}
              </span>
            </span>
          </a>
        </div>

        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-6">
          <form
            onSubmit={handleReceiptSubmit}
            className="surface-sub p-5 rounded-2xl border border-gold/35 space-y-4"
          >
            <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-3 gap-2">
              <div>
                <h3 className="font-black text-gold-royal text-sm sm:text-base">
                  تأكيد الدفع وتفعيل الاشتراك (BaridiMob / CCP)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  يُحفظ وصلك بأمان في السحابة ويصل فوراً إلى لوحة المديرة للاعتماد والتفعيل.
                </p>
              </div>
              {renderSubscriptionStatus()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label htmlFor="stu-pay-name" className="block text-[11px] font-bold text-slate-300 mb-1">
                  اسم التلميذ الكامل
                </label>
                <input
                  id="stu-pay-name"
                  type="text"
                  maxLength={100}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="أدخل اسم التلميذ"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="stu-pay-method" className="block text-[11px] font-bold text-slate-300 mb-1">
                  طريقة الدفع
                </label>
                <select
                  id="stu-pay-method"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-turquoise-300 font-bold focus:border-gold focus:outline-none"
                >
                  <option value="BaridiMob">بريدي موب (BaridiMob)</option>
                  <option value="CCP">حساب بريدي (CCP)</option>
                </select>
              </div>

              <div>
                <label htmlFor="stu-pay-ref" className="block text-[11px] font-bold text-slate-300 mb-1">
                  رقم العملية / الوصل
                </label>
                <input
                  id="stu-pay-ref"
                  type="text"
                  maxLength={60}
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="مثال: OP-984512"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="stu-pay-file" className="block text-[11px] font-bold text-slate-300 mb-1">
                  صورة الوصل (JPG/PNG/PDF)
                </label>
                <label
                  htmlFor="stu-pay-file"
                  className="w-full flex items-center justify-center gap-1.5 bg-darknavy border border-dashed border-gold/55 hover:border-gold rounded-xl px-3 py-2 text-xs text-gold-royal font-bold cursor-pointer transition truncate"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{fileName ? fileName : 'اختر ملف الوصل'}</span>
                </label>
                <input
                  ref={fileInputRef}
                  id="stu-pay-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => void handleFileChange(e)}
                  className="hidden"
                />
              </div>
            </div>

            {previewUrl && (
              <div className="bg-darknavy/90 p-3 rounded-xl border border-turquoise-500/35 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isPdf ? (
                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-gold/40 flex items-center justify-center text-gold-royal shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="معاينة وصل الدفع"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-lg border border-gold/45 shrink-0"
                    />
                  )}
                  <div className="text-xs min-w-0">
                    <span className="font-bold text-gold-royal block">
                      وصل الدفع مضغوط وجاهز للإرسال الآمن
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">{fileName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-rose-400 hover:text-rose-300 text-xs px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إزالة</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 disabled:opacity-60 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'جاري الإرسال الآمن...' : 'إرسال وصل الدفع للمراجعة'}</span>
              </button>

              <a
                href={buildWhatsAppLink(
                  `السلام عليكم إدارة منصة النبراس، أرسل لكم نسخة من وصل الدفع (${payMethod}) برقم مرجعي ${payRef || 'غير محدد'} للتلميذ ${studentName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/45 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  إرسال نسخة عبر واتساب <span dir="ltr">{WHATSAPP_NUMBER_DISPLAY}</span>
                </span>
              </a>
            </div>

            {studentReceipts.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  سجل وصلات الدفع الخاصة بحسابك ({studentReceipts.length})
                </h4>
                <div className="divide-y divide-slate-800/80">
                  {studentReceipts.map((rec) => (
                    <div
                      key={rec.id}
                      className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">
                          {rec.studentName}{' '}
                          <span className="text-slate-500 font-normal">·</span>{' '}
                          <span className="text-turquoise-300">{rec.method}</span>{' '}
                          <span className="text-slate-500 font-normal">·</span>{' '}
                          <span className="font-mono text-slate-300" dir="ltr">
                            {rec.ref}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {rec.sectionType} · {formatDzd(rec.amount)} · {rec.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                            rec.status === 'approved'
                              ? 'text-emerald-400'
                              : rec.status === 'rejected'
                              ? 'text-rose-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {rec.status === 'approved' && (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> معتمد ومفعّل
                            </>
                          )}
                          {rec.status === 'pending' && (
                            <>
                              <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                            </>
                          )}
                          {rec.status === 'rejected' && (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> مرفوض
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => onPreviewReceipt(rec)}
                          className="text-turquoise-300 hover:text-gold-royal text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Lessons List */}
          <div className="surface-sub p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-3 gap-2">
              <h3 className="font-bold text-gold-royal text-sm sm:text-base">
                الدروس المباشرة والمسجلة المتاحة الآن
              </h3>
              <span className="text-xs text-turquoise-300 font-semibold">
                {level} · {subject === 'الكل' ? 'جميع المواد' : subject}
              </span>
            </div>

            {filteredLessons.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-darknavy/70 border border-slate-800 space-y-3">
                <p className="text-xs sm:text-sm text-slate-300">
                  لا توجد دروس منشورة حالياً لـ ({level} — {subject}).
                </p>
                {subject !== 'الكل' && (
                  <button
                    type="button"
                    onClick={() => setSubject('الكل')}
                    className="px-4 py-2 turquoise-gradient text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    عرض جميع المواد لهذا المستوى
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
                {filteredLessons.map((lesson) => (
                  <article
                    key={lesson.id}
                    className="bg-darknavy/90 p-4 rounded-xl border border-slate-800 hover:border-gold/45 transition space-y-2.5"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                          <span className="text-turquoise-300 font-bold">{lesson.method}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-gold-royal font-semibold">{lesson.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-semibold">{lesson.time}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{lesson.title}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      {lesson.level} — {lesson.stream}
                    </p>

                    <div className="flex flex-wrap justify-between items-center pt-2.5 border-t border-slate-800/90 gap-2">
                      <a
                        href={lesson.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 turquoise-gradient text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 hover:brightness-110 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>دخول الحصة عبر {lesson.method}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleLessonDownload(lesson)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                          lesson.allowDownload
                            ? 'bg-gold/15 hover:bg-gold/25 text-gold-royal border border-gold/40'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {lesson.allowDownload ? (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل الوثيقة ({lesson.fileName})</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>التحميل مغلق من الأستاذ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Certificates Board */}
          <div className="surface-sub p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
              <h3 className="font-bold text-gold-royal text-sm sm:text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-royal" />
                <span>لوحة شهادات التفوق والتكريم الممنوحة للتلاميذ</span>
              </h3>
              <span className="text-xs text-slate-400 tabular-nums">
                {studentCertificates.length} شهادات
              </span>
            </div>

            {studentCertificates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                لم يتم إصدار شهادات تفوق بعد.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-darknavy/90 p-4 rounded-xl border border-gold/35 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-black text-gold-royal">{cert.recipient}</div>
                      <p className="text-xs text-slate-200 leading-relaxed">{cert.reason}</p>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        ممنوحة من: {cert.issuer} · {cert.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPreviewCertificate(cert)}
                      className="self-start text-xs font-bold text-turquoise-300 hover:text-gold-royal inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض وطباعة الشهادة</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
