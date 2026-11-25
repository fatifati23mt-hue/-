import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lock,
  MessageCircle,
  Send,
  ShieldUser,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { BillingCycle, Lesson, PaymentMethod, PlatformState, SectionType } from '../types';
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

interface ParentPortalProps {
  state: PlatformState;
  defaultChildName: string;
  onSelectSection: (section: SectionType, cycle?: BillingCycle) => void;
  onSelectBillingCycle: (cycle: BillingCycle) => void;
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
  onNotify: (text: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  state,
  defaultChildName,
  onSelectSection,
  onSelectBillingCycle,
  onSubmitReceipt,
  onNotify,
}) => {
  const [childName, setChildName] = useState<string>(defaultChildName || 'محمد أمين بن علي');
  const [level, setLevel] = useState<string>('السنة الثالثة ثانوي');
  const [stream, setStream] = useState<string>(LEVEL_STREAMS['السنة الثالثة ثانوي'][0]);
  const [subject, setSubject] = useState<string>('الرياضيات');

  const [payMethod, setPayMethod] = useState<PaymentMethod>('BaridiMob');
  const [payRef, setPayRef] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableStreams = LEVEL_STREAMS[level] ?? ['عام'];
  const activePrice =
    state.billingCycle === 'annual'
      ? state.annualPrices[state.activeSection]
      : state.prices[state.activeSection];

  const handleLevelChange = (nextLevel: string) => {
    setLevel(nextLevel);
    setStream((LEVEL_STREAMS[nextLevel] ?? ['عام'])[0]);
  };

  const progressData = useMemo(() => {
    const seed = (childName.length + subject.length * 3 + level.length) % 11;
    const overallPct = Math.min(98, 84 + seed);
    const attended = 12 + (seed % 5);
    const absences = seed % 3 === 0 ? 1 : 0;
    const score = (16.5 + (seed % 7) * 0.45).toFixed(1);

    const units = [
      { label: `المحور الأول — الأساسيات والمفاهيم في ${subject}`, pct: Math.min(100, overallPct + 6) },
      { label: `المحور الثاني — التمارين التطبيقية وحلول النماذج`, pct: overallPct },
      { label: `المحور الثالث — المراجعة الشاملة والاختبارات الفصلية`, pct: Math.max(64, overallPct - 9) },
    ];
    return { overallPct, attended, absences, score, units };
  }, [childName, subject, level]);

  const latestChildReceipt = state.receipts[0];

  const relevantLessons = useMemo(() => {
    const exact = state.lessons.filter((l) => l.level === level);
    return exact.length > 0 ? exact : state.lessons;
  }, [state.lessons, level]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = childName.trim().slice(0, 100);
    const cleanRef = payRef.trim().slice(0, 60);
    if (!cleanName) {
      onNotify('يرجى إدخال اسم الابن أو الابنة أولاً.', 'warning');
      return;
    }
    if (cleanRef.length < 2) {
      onNotify('يرجى إدخال رقم العملية المرجعي لوصل الدفع.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitReceipt({
        studentName: cleanName,
        submittedBy: 'ولي أمر',
        level,
        stream,
        subject,
        sectionType: state.activeSection,
        amount: activePrice,
        method: payMethod,
        ref: cleanRef,
        fileName: (fileName || `وصل_ولي_${cleanRef}.jpg`).slice(0, 160),
        previewUrl,
        isPdf,
      });
      setPayRef('');
      clearFile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (lesson: Lesson) => {
    if (!lesson.allowDownload) {
      onNotify('التحميل مقيد حالياً من طرف الأستاذ لهذه الحصة.', 'warning');
      return;
    }
    triggerDocumentDownload(lesson.fileName, [
      `تقرير ووثيقة ولي الأمر — منصة النبراس التعليمية`,
      `التلميذ: ${childName}`,
      `الدرس: ${lesson.title}`,
      `المستوى: ${lesson.level} (${lesson.stream})`,
      `المادة: ${lesson.subject}`,
      `الملف: ${lesson.fileName}`,
    ]);
    onNotify(`تم تحميل الوثيقة بنجاح: ${lesson.fileName}`, 'success');
  };

  const renderStatus = () => {
    if (!latestChildReceipt) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Clock className="w-4 h-4" />
          حالة الاشتراك: بانتظار الوصل
        </span>
      );
    }
    if (latestChildReceipt.status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          حالة الاشتراك: مفعّل ومعتمد
        </span>
      );
    }
    if (latestChildReceipt.status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300">
          <XCircle className="w-4 h-4" />
          حالة الاشتراك: مرفوض — يرجى إعادة الإرسال
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

  return (
    <section className="surface-panel rounded-3xl p-5 sm:p-7 space-y-6 border-turquoise-400/35">
      <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-turquoise-300 flex items-center gap-2">
            <ShieldUser className="w-6 h-6 text-gold-royal shrink-0" />
            <span>بوابة الأولياء لمتابعة تقدم الأبناء</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            حدد المستوى، الشعبة، المادة ونوع القسم لمتابعة نسبة إنجاز الدروس، الحضور والغياب، وتحميل الوثائق.
          </p>
        </div>
        <span className="text-xs font-bold text-gold-royal">متابعة بيداغوجية لحظية</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-4 surface-sub p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-gold-royal text-sm border-b border-slate-700/70 pb-2.5">
            بيانات الابن والمسار الدراسي
          </h3>

          <div>
            <label htmlFor="par-child" className="block text-xs font-bold text-slate-200 mb-1.5">
              اسم التلميذ (الابن / الابنة)
            </label>
            <input
              id="par-child"
              type="text"
              maxLength={100}
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-turquoise-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="par-level" className="block text-xs font-bold text-slate-200 mb-1.5">
              المستوى الدراسي
            </label>
            <select
              id="par-level"
              value={level}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-turquoise-400 focus:outline-none"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="par-stream" className="block text-xs font-bold text-slate-200 mb-1.5">
              الشعبة الدراسية
            </label>
            <select
              id="par-stream"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-turquoise-400 focus:outline-none"
            >
              {availableStreams.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="par-subject" className="block text-xs font-bold text-slate-200 mb-1.5">
              المادة المراد متابعتها (جميع المواد)
            </label>
            <select
              id="par-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-turquoise-400 focus:outline-none"
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="par-section" className="block text-xs font-bold text-slate-200 mb-1.5">
              نوع القسم المسجل به الابن
            </label>
            <select
              id="par-section"
              value={state.activeSection}
              onChange={(e) => onSelectSection(e.target.value as SectionType)}
              className="w-full bg-darknavy border border-turquoise-400/55 rounded-xl px-3 py-2.5 text-xs text-turquoise-300 font-bold focus:outline-none"
            >
              {SECTION_TYPES.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

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
              اشتراك شهري
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
              اشتراك سنوي
            </button>
          </div>

          <div className="bg-darknavy/95 p-4 rounded-xl border border-gold/40 flex justify-between items-center">
            <span className="text-xs text-slate-300">
              {state.billingCycle === 'annual' ? 'سعر القسم السنوي:' : 'سعر القسم الشهري:'}
            </span>
            <span className="text-lg font-black text-gold-royal tabular-nums">
              {formatDzd(activePrice)}
            </span>
          </div>
        </div>

        {/* Right Progress & Payment Dashboard */}
        <div className="lg:col-span-8 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="surface-sub p-5 rounded-2xl border border-gold/35 space-y-4"
          >
            <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-3 gap-2">
              <div>
                <h3 className="font-black text-gold-royal text-sm sm:text-base">
                  تأكيد دفع اشتراك الابن وتفعيله (BaridiMob / CCP)
                </h3>
                <p className="text-[11px] text-slate-300 mt-1">
                  CCP الإدارة:{' '}
                  <strong className="text-gold-royal font-mono" dir="ltr">
                    {state.ccp}
                  </strong>{' '}
                  · بريدي موب:{' '}
                  <strong className="text-turquoise-300 font-mono" dir="ltr">
                    {state.baridi}
                  </strong>
                </p>
              </div>
              {renderStatus()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="par-pay-method" className="block text-[11px] font-bold text-slate-300 mb-1">
                  طريقة الدفع
                </label>
                <select
                  id="par-pay-method"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-turquoise-300 font-bold focus:border-gold focus:outline-none"
                >
                  <option value="BaridiMob">بريدي موب (BaridiMob)</option>
                  <option value="CCP">حساب بريدي (CCP)</option>
                </select>
              </div>

              <div>
                <label htmlFor="par-pay-ref" className="block text-[11px] font-bold text-slate-300 mb-1">
                  رقم العملية / الوصل
                </label>
                <input
                  id="par-pay-ref"
                  type="text"
                  maxLength={60}
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="مثال: BM-774102"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="par-pay-file" className="block text-[11px] font-bold text-slate-300 mb-1">
                  صورة الوصل (JPG/PNG/PDF)
                </label>
                <label
                  htmlFor="par-pay-file"
                  className="w-full flex items-center justify-center gap-1.5 bg-darknavy border border-dashed border-gold/55 hover:border-gold rounded-xl px-3 py-2 text-xs text-gold-royal font-bold cursor-pointer transition truncate"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{fileName ? fileName : 'إرفاق صورة الوصل'}</span>
                </label>
                <input
                  ref={fileInputRef}
                  id="par-pay-file"
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
                      alt="معاينة وصل دفع الابن"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-lg border border-gold/45 shrink-0"
                    />
                  )}
                  <div className="text-xs min-w-0">
                    <span className="font-bold text-gold-royal block">
                      معاينة وصل دفع اشتراك الابن
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">{fileName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-rose-400 hover:text-rose-300 text-xs px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إزالة</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  `السلام عليكم إدارة منصة النبراس، بصفتي ولي أمر التلميذ ${childName} أرسل لكم نسخة من وصل الدفع (${payMethod}) لتفعيل الاشتراك.`
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
          </form>

          {/* 4 KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="surface-sub p-4 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block">تقدم الدروس</span>
              <span className="text-xl font-black text-gold-royal mt-1 block tabular-nums">
                {progressData.overallPct}%
              </span>
            </div>
            <div className="surface-sub p-4 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block">الحصص الحاضرة</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block tabular-nums">
                {progressData.attended} حصة
              </span>
            </div>
            <div className="surface-sub p-4 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block">الغيابات</span>
              <span className="text-xl font-black text-rose-400 mt-1 block tabular-nums">
                {progressData.absences} حصة
              </span>
            </div>
            <div className="surface-sub p-4 rounded-xl text-center">
              <span className="text-[11px] text-slate-400 block">معدل التقييم</span>
              <span className="text-xl font-black text-turquoise-300 mt-1 block tabular-nums">
                {progressData.score} / 20
              </span>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="surface-sub p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-3 gap-2">
              <h3 className="font-bold text-gold-royal text-sm">
                تقرير إنجاز البرنامج الدراسي لـ:{' '}
                <span className="text-white">{childName || 'التلميذ'}</span>
              </h3>
              <span className="text-xs text-turquoise-300 font-semibold">
                {level} · {stream} · {subject}
              </span>
            </div>

            <div className="space-y-4">
              {progressData.units.map((unit) => (
                <div key={unit.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold">{unit.label}</span>
                    <span className="font-bold text-gold-royal tabular-nums">{unit.pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-darknavy rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full turquoise-gradient rounded-full transition-all duration-300"
                      style={{ width: `${unit.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance & Permitted Documents */}
          <div className="surface-sub p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-turquoise-300 text-sm border-b border-slate-700/70 pb-2.5">
              سجل الحضور والوثائق المسموح بتحميلها للولي
            </h3>

            {relevantLessons.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                لا توجد دروس أو وثائق منشورة بعد لهذا المستوى.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {relevantLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="py-3 flex flex-wrap justify-between items-center gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white">{lesson.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {lesson.subject} · {lesson.method} · {lesson.time}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(lesson)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                        lesson.allowDownload
                          ? 'bg-turquoise-700/35 hover:bg-turquoise-700/55 text-turquoise-200 border border-turquoise-400/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {lesson.allowDownload ? (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل ({lesson.fileName})</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>التحميل مقيد</span>
                        </>
                      )}
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
