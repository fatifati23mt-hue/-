import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  ExternalLink,
  Film,
  IdCard,
  Link2,
  Lock,
  MessageCircle,
  Presentation,
  Save,
  Send,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Video,
  Wallet,
  X,
  Youtube,
} from 'lucide-react';
import { PlatformState, TeachingMethod, UserProfile } from '../types';
import {
  LEVELS,
  LEVEL_STREAMS,
  SUBJECTS,
  TEACHING_METHODS,
  formatDzd,
} from '../data/initialData';

interface TeacherPortalProps {
  state: PlatformState;
  userProfile: UserProfile | null;
  isAuthorized: boolean;
  approvedGross: number;
  platformShareAmount: number;
  teacherShareAmount: number;
  approvedReceiptsCount: number;
  onSaveTeacherCard: (card: {
    firstName: string;
    lastName: string;
    birthDate: string;
    ccp: string;
    subject: string;
  }) => Promise<void>;
  onMarkPresent: () => Promise<void> | void;
  onEnroll: () => Promise<void> | void;
  onOpenRoster: () => void;
  onSaveTeacherCcp: (ccp: string) => Promise<void>;
  onRequestPayout: () => Promise<void>;
  onPublishLesson: (payload: {
    level: string;
    stream: string;
    subject: string;
    method: TeachingMethod;
    title: string;
    link: string;
    fileName: string;
    allowDownload: boolean;
  }) => Promise<void>;
  onToggleLessonDownload: (lessonId: string, nextValue: boolean) => Promise<void>;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  onGrantStudentCert: (student: string, reason: string) => Promise<void>;
  onNotify: (text: string, tone?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface MethodAppMeta {
  arLabel: string;
  appUrl: string;
  androidPackage: string;
  androidDefaultIntent: string;
  openAppLabel: string;
  placeholder: string;
  openBtnClass: string;
}

const WHATSAPP_DEFAULT_MESSAGE = encodeURIComponent(
  'السلام عليكم، حصة عبر منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى'
);
const WHATSAPP_UNIVERSAL_URL = `https://api.whatsapp.com/send?text=${WHATSAPP_DEFAULT_MESSAGE}`;

const METHOD_APP_CONFIG: Record<TeachingMethod, MethodAppMeta> = {
  Telegram: {
    arLabel: 'تيليغرام',
    appUrl: 'https://t.me/',
    androidPackage: 'org.telegram.messenger',
    androidDefaultIntent: `intent://t.me/#Intent;scheme=https;package=org.telegram.messenger;S.browser_fallback_url=${encodeURIComponent('https://t.me/')};end`,
    openAppLabel: 'الدخول لتطبيق تيليغرام مباشرة',
    placeholder: 'https://t.me/+... رابط قناة أو مجموعة تيليغرام',
    openBtnClass:
      'bg-sky-600/25 hover:bg-sky-600/40 text-sky-200 border-sky-400/60 hover:border-sky-300',
  },
  WhatsApp: {
    arLabel: 'واتساب',
    appUrl: WHATSAPP_UNIVERSAL_URL,
    androidPackage: 'com.whatsapp',
    androidDefaultIntent: `intent://send?text=${WHATSAPP_DEFAULT_MESSAGE}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${encodeURIComponent(WHATSAPP_UNIVERSAL_URL)};end`,
    openAppLabel: 'الدخول لتطبيق واتساب مباشرة',
    placeholder: 'https://chat.whatsapp.com/... رابط مجموعة واتساب',
    openBtnClass:
      'bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border-emerald-400/60 hover:border-emerald-300',
  },
  'Google Meet': {
    arLabel: 'غوغل ميت',
    appUrl: 'https://meet.google.com/',
    androidPackage: 'com.google.android.apps.tachyon',
    androidDefaultIntent: `intent://meet.google.com/#Intent;scheme=https;package=com.google.android.apps.tachyon;S.browser_fallback_url=${encodeURIComponent('https://meet.google.com/')};end`,
    openAppLabel: 'الدخول لتطبيق غوغل ميت مباشرة',
    placeholder: 'https://meet.google.com/xxx-xxxx-xxx رابط الحصة',
    openBtnClass:
      'bg-teal-600/25 hover:bg-teal-600/40 text-teal-200 border-teal-400/60 hover:border-teal-300',
  },
  YouTube: {
    arLabel: 'اليوتيوب',
    appUrl: 'https://www.youtube.com/',
    androidPackage: 'com.google.android.youtube',
    androidDefaultIntent: `intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent('https://www.youtube.com/')};end`,
    openAppLabel: 'الدخول لتطبيق اليوتيوب مباشرة',
    placeholder: 'https://youtube.com/live/... رابط البث أو الفيديو',
    openBtnClass:
      'bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border-rose-400/60 hover:border-rose-300',
  },
  Zoom: {
    arLabel: 'زوم',
    appUrl: 'https://zoom.us/join',
    androidPackage: 'us.zoom.videomeetings',
    androidDefaultIntent: `intent://zoom.us/join#Intent;scheme=https;package=us.zoom.videomeetings;S.browser_fallback_url=${encodeURIComponent('https://zoom.us/join')};end`,
    openAppLabel: 'الدخول لتطبيق Zoom مباشرة',
    placeholder: 'https://zoom.us/j/... رابط قاعة Zoom',
    openBtnClass:
      'bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border-blue-400/60 hover:border-blue-300',
  },
  'دروس مسجلة': {
    arLabel: 'دروس مسجلة',
    appUrl: 'https://www.youtube.com/',
    androidPackage: 'com.google.android.youtube',
    androidDefaultIntent: `intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent('https://www.youtube.com/')};end`,
    openAppLabel: 'فتح تطبيق الفيديو مباشرة',
    placeholder: 'https://... رابط الدرس المسجل',
    openBtnClass:
      'bg-amber-600/25 hover:bg-amber-600/40 text-amber-200 border-amber-400/60 hover:border-amber-300',
  },
};

function toSafeHttpUrl(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href.slice(0, 300);
    }
  } catch {
    // Fall back to official app URL when user input is not a valid URL
  }
  return fallback;
}

function buildMobileAppLaunchTarget(
  meta: MethodAppMeta,
  rawEnteredLink: string
): { href: string; openInNewTab: boolean } {
  const hasCustomLink = rawEnteredLink.trim().length > 0;
  const safeHttpsUrl = toSafeHttpUrl(rawEnteredLink, meta.appUrl);

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { href: safeHttpsUrl, openInNewTab: true };
  }

  const isAndroid = /android/i.test(navigator.userAgent || '');
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  // On top-level Android mobile browsers, intent:// launches the installed native phone app directly
  // with automatic fallback to the official HTTPS universal link if the app is not installed.
  if (isAndroid && !isInIframe) {
    if (!hasCustomLink) {
      return { href: meta.androidDefaultIntent, openInNewTab: false };
    }
    try {
      const parsed = new URL(safeHttpsUrl);
      const scheme = parsed.protocol.replace(':', '');
      const hostAndPath = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
      const customIntent = `intent://${hostAndPath}#Intent;scheme=${scheme};package=${meta.androidPackage};S.browser_fallback_url=${encodeURIComponent(safeHttpsUrl)};end`;
      return { href: customIntent, openInNewTab: false };
    } catch {
      return { href: meta.androidDefaultIntent, openInNewTab: false };
    }
  }

  // Inside iframes, on iOS (Universal Links), and on desktop, official HTTPS universal links
  // opened in a new top-level tab trigger the native phone app cleanly without iframe blocks.
  return { href: safeHttpsUrl, openInNewTab: true };
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  state,
  userProfile,
  isAuthorized,
  approvedGross,
  platformShareAmount,
  teacherShareAmount,
  approvedReceiptsCount,
  onSaveTeacherCard,
  onMarkPresent,
  onEnroll,
  onOpenRoster,
  onSaveTeacherCcp,
  onRequestPayout,
  onPublishLesson,
  onToggleLessonDownload,
  onDeleteLesson,
  onGrantStudentCert,
  onNotify,
}) => {
  const [ccpInput, setCcpInput] = useState<string>(state.teacherCcp);
  const [infoCardOpen, setInfoCardOpen] = useState<boolean>(false);
  const [teacherFirstName, setTeacherFirstName] = useState<string>(
    userProfile?.firstName || userProfile?.displayName?.split(' ')[0] || ''
  );
  const [teacherLastName, setTeacherLastName] = useState<string>(
    userProfile?.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || ''
  );
  const [teacherBirthDate, setTeacherBirthDate] = useState<string>(
    userProfile?.birthDate || ''
  );
  const matchedTeacherRecord = state.teachers.find((t) => t.uid === userProfile?.uid);
  const [teacherPersonalCcp, setTeacherPersonalCcp] = useState<string>(
    userProfile?.ccp || state.teacherCcp
  );
  const [teacherTeachingSubject, setTeacherTeachingSubject] = useState<string>(
    userProfile?.subject || matchedTeacherRecord?.subject || SUBJECTS[0]
  );
  const [subjectPickerOpen, setSubjectPickerOpen] = useState<boolean>(false);
  const [isSavingCard, setIsSavingCard] = useState<boolean>(false);

  const [level, setLevel] = useState<string>('السنة الثالثة ثانوي');
  const [stream, setStream] = useState<string>(LEVEL_STREAMS['السنة الثالثة ثانوي'][0]);
  const [subject, setSubject] = useState<string>('الرياضيات');
  const [method, setMethod] = useState<TeachingMethod>('Telegram');
  const [title, setTitle] = useState<string>('');
  const [methodLinks, setMethodLinks] = useState<Record<TeachingMethod, string>>({
    Zoom: '',
    Telegram: '',
    'Google Meet': '',
    YouTube: '',
    WhatsApp: '',
    'دروس مسجلة': '',
  });
  const [isSendingLink, setIsSendingLink] = useState<boolean>(false);
  const [docName, setDocName] = useState<string>('');
  const [allowDownload, setAllowDownload] = useState<boolean>(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [certStudent, setCertStudent] = useState<string>('');
  const [certReason, setCertReason] = useState<string>('');

  useEffect(() => {
    setCcpInput(state.teacherCcp);
  }, [state.teacherCcp]);

  useEffect(() => {
    if (userProfile?.firstName !== undefined) setTeacherFirstName(userProfile.firstName);
    if (userProfile?.lastName !== undefined) setTeacherLastName(userProfile.lastName);
    if (userProfile?.birthDate !== undefined) setTeacherBirthDate(userProfile.birthDate);
    if (userProfile?.ccp !== undefined) {
      setTeacherPersonalCcp(userProfile.ccp);
    } else {
      setTeacherPersonalCcp(state.teacherCcp);
    }
    if (userProfile?.subject) {
      setTeacherTeachingSubject(userProfile.subject);
    } else if (matchedTeacherRecord?.subject) {
      setTeacherTeachingSubject(matchedTeacherRecord.subject);
    }
  }, [userProfile, state.teacherCcp, matchedTeacherRecord?.subject]);

  if (!isAuthorized) {
    return (
      <section className="surface-panel rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-gold/40 text-gold-royal flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-gold-royal">بوابة الأساتذة محمية بالصلاحيات</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          الوصول إلى أدوات نشر الدروس، قوائم الحضور، ومحفظة أرباح الأساتذة محصور بالأساتذة المعتمدين وإدارة المنصة فقط، ومحمي بقواعد أمان Firestore على مستوى الخادم.
        </p>
        <p className="text-xs text-slate-400">
          إذا كنت أستاذاً في منصة النبراس، يرجى التواصل مع المديرة العامة لتفعيل صلاحية الأستاذ لحسابك.
        </p>
      </section>
    );
  }

  const availableStreams = LEVEL_STREAMS[level] ?? ['عام'];
  const activeMeta = state.sectionsMeta[state.activeSection];
  const absentCount = Math.max(0, activeMeta.reg - activeMeta.pres);

  const methodIcon = (m: TeachingMethod) => {
    switch (m) {
      case 'Zoom':
      case 'Google Meet':
        return <Video className="w-3.5 h-3.5" />;
      case 'YouTube':
        return <Youtube className="w-3.5 h-3.5" />;
      case 'Telegram':
      case 'WhatsApp':
        return <MessageCircle className="w-3.5 h-3.5" />;
      default:
        return <Film className="w-3.5 h-3.5" />;
    }
  };

  const handleLevelChange = (next: string) => {
    setLevel(next);
    setStream((LEVEL_STREAMS[next] ?? ['عام'])[0]);
  };

  const activeMethodMeta = METHOD_APP_CONFIG[method];
  const currentLink = methodLinks[method] ?? '';
  const setCurrentLink = (nextVal: string) => {
    setMethodLinks((prev) => ({ ...prev, [method]: nextVal }));
  };
  const directAppTarget = buildMobileAppLaunchTarget(activeMethodMeta, currentLink);

  const handleSendLinkToStudent = async () => {
    const trimmed = currentLink.trim();
    if (!trimmed) {
      onNotify(
        `يرجى لصق أو إدخال رابط ${activeMethodMeta.arLabel} أولاً ثم الضغط على «إرسال الرابط للتلميذ».`,
        'warning'
      );
      return;
    }
    const safeLink = toSafeHttpUrl(trimmed, '');
    if (!safeLink) {
      onNotify('الرابط المدخل غير صالح. يرجى التأكد من صحة الرابط.', 'warning');
      return;
    }
    const autoTitle = (
      title.trim() || `رابط حصة ${activeMethodMeta.arLabel} — ${subject}`
    ).slice(0, 160);

    setIsSendingLink(true);
    try {
      await onPublishLesson({
        level,
        stream,
        subject,
        method,
        title: autoTitle,
        link: safeLink,
        fileName: (docName || `رابط_${activeMethodMeta.arLabel}_${subject.replace(/\s+/g, '_')}.txt`).slice(0, 160),
        allowDownload,
      });
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(safeLink);
        } catch {
          // Clipboard copy is optional
        }
      }
      setCurrentLink('');
      setTitle('');
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim().slice(0, 160);
    if (!cleanTitle) {
      onNotify('يرجى إدخال عنوان الحصة أو الدرس قبل النشر.', 'warning');
      return;
    }
    const cleanLink = toSafeHttpUrl(currentLink, activeMethodMeta.appUrl);
    await onPublishLesson({
      level,
      stream,
      subject,
      method,
      title: cleanTitle,
      link: cleanLink,
      fileName: (docName || `ملخص_${subject.replace(/\s+/g, '_')}.pdf`).slice(0, 160),
      allowDownload,
    });
    setTitle('');
    setCurrentLink('');
    setDocName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStudent = certStudent.trim().slice(0, 100);
    const cleanReason = certReason.trim().slice(0, 240);
    if (!cleanStudent || cleanReason.length < 2) {
      onNotify('يرجى إدخال اسم التلميذ وسبب التكريم لإصدار الشهادة.', 'warning');
      return;
    }
    await onGrantStudentCert(cleanStudent, cleanReason);
    setCertStudent('');
    setCertReason('');
  };

  const handleSaveTeacherInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = teacherFirstName.trim().slice(0, 60);
    const cleanLast = teacherLastName.trim().slice(0, 60);
    const cleanCcp = teacherPersonalCcp.trim().slice(0, 60);
    if (!cleanFirst || !cleanLast) {
      onNotify('يرجى إدخال اسم ولقب الأستاذ.', 'warning');
      return;
    }
    if (!teacherBirthDate.trim()) {
      onNotify('يرجى تحديد تاريخ ميلاد الأستاذ.', 'warning');
      return;
    }
    if (cleanCcp.length < 3) {
      onNotify('يرجى إدخال رقم CCP الخاص بالأستاذ بشكل صحيح.', 'warning');
      return;
    }
    setIsSavingCard(true);
    try {
      await onSaveTeacherCard({
        firstName: cleanFirst,
        lastName: cleanLast,
        birthDate: teacherBirthDate.trim().slice(0, 20),
        ccp: cleanCcp,
        subject: teacherTeachingSubject.trim().slice(0, 80),
      });
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
    <section className="surface-panel rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gold-royal flex items-center gap-2">
            <Presentation className="w-6 h-6 text-turquoise-400 shrink-0" />
            <span>بوابة الأساتذة الاحترافية</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            اختيار طريقة التدريس، متابعة التلاميذ المسجلين والحاضرين والغائبين، أرباح CCP المؤكدة ({state.teacherSharePct}%)، وتكريم المتفوقين.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setInfoCardOpen((prev) => !prev)}
            aria-expanded={infoCardOpen}
            className={`group px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all duration-200 active:scale-95 cursor-pointer ${
              infoCardOpen
                ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                : 'bg-darknavy hover:bg-gold/15 text-gold-royal border-gold/50 hover:border-gold-royal'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                infoCardOpen
                  ? 'bg-darknavy/20 text-darknavy'
                  : 'bg-gold/15 text-gold-royal group-hover:bg-gold/25'
              }`}
            >
              <IdCard className="w-4 h-4" />
            </span>
            <span>معلومات الأستاذ</span>
          </button>

          <span className="text-xs font-bold text-turquoise-300">
            أرباح مؤكدة · {approvedReceiptsCount} اشتراكات
          </span>
        </div>
      </div>

      {/* Expandable Teacher Information Card */}
      {infoCardOpen && (
        <div className="surface-sub p-5 rounded-2xl border-2 border-gold/50 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Live Teacher ID Card Preview */}
          <div className="lg:col-span-5 bg-gradient-to-br from-darknavy via-[#0b2339] to-[#0a3642] p-5 rounded-2xl border border-gold/55 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-gold/25 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl royal-gold-gradient text-darknavy flex items-center justify-center shadow">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-turquoise-300 block">
                    بطاقة هوية الأستاذ · منصة النبراس
                  </span>
                  <h3 className="text-sm font-black text-gold-royal">
                    {teacherFirstName || teacherLastName
                      ? `${teacherFirstName} ${teacherLastName}`.trim()
                      : userProfile?.displayName || 'أستاذ منصة النبراس'}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                أستاذ معتمد
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الاسم</span>
                <strong className="text-white font-bold mt-0.5 block">
                  {teacherFirstName || '—'}
                </strong>
              </div>
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">اللقب</span>
                <strong className="text-white font-bold mt-0.5 block">
                  {teacherLastName || '—'}
                </strong>
              </div>
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-turquoise-300" />
                  تاريخ الميلاد
                </span>
                <strong className="text-turquoise-200 font-mono font-bold mt-0.5 block tabular-nums" dir="ltr">
                  {teacherBirthDate || 'غير محدد'}
                </strong>
              </div>
              <div className="bg-darknavy/80 p-2.5 rounded-xl border border-gold/30">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-gold-royal" />
                  رقم CCP الأستاذ
                </span>
                <strong className="text-gold-royal font-mono font-bold mt-0.5 block truncate tabular-nums" dir="ltr">
                  {teacherPersonalCcp || '—'}
                </strong>
              </div>
              <div className="col-span-2 bg-darknavy/80 p-2.5 rounded-xl border border-turquoise-500/35 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-turquoise-300" />
                    مادة التدريس
                  </span>
                  <strong className="text-turquoise-200 font-black mt-0.5 block">
                    {teacherTeachingSubject || 'غير محددة'}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSubjectPickerOpen((prev) => !prev)}
                  aria-expanded={subjectPickerOpen}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black border inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer shrink-0 ${
                    subjectPickerOpen
                      ? 'turquoise-gradient text-white border-turquoise-300 shadow-[0_0_14px_rgba(20,184,166,0.5)]'
                      : 'bg-slate-900 hover:bg-turquoise-500/15 text-turquoise-300 border-turquoise-400/50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>مادة التدريس</span>
                </button>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form
            onSubmit={(e) => void handleSaveTeacherInfo(e)}
            className="lg:col-span-7 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-gold-royal">
                  تحديث معلومات الأستاذ الشخصية والمالية
                </h3>
                <p className="text-[11px] text-slate-400">
                  بياناتك معزولة ومحفوظة سحابياً لا يطّلع عليها إلا حسابك والإدارة العليا.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoCardOpen(false)}
                aria-label="إغلاق بطاقة معلومات الأستاذ"
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tea-first-name" className="block text-xs font-bold text-slate-200 mb-1">
                  الاسم
                </label>
                <input
                  id="tea-first-name"
                  type="text"
                  maxLength={60}
                  value={teacherFirstName}
                  onChange={(e) => setTeacherFirstName(e.target.value)}
                  placeholder="مثال: ليلى"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="tea-last-name" className="block text-xs font-bold text-slate-200 mb-1">
                  اللقب
                </label>
                <input
                  id="tea-last-name"
                  type="text"
                  maxLength={60}
                  value={teacherLastName}
                  onChange={(e) => setTeacherLastName(e.target.value)}
                  placeholder="مثال: بن علي"
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="tea-birth-date" className="block text-xs font-bold text-slate-200 mb-1">
                  تاريخ الميلاد
                </label>
                <input
                  id="tea-birth-date"
                  type="date"
                  value={teacherBirthDate}
                  onChange={(e) => setTeacherBirthDate(e.target.value)}
                  className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-turquoise-200 font-mono focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="tea-personal-ccp" className="block text-xs font-bold text-slate-200 mb-1">
                  رقم CCP الخاص بالأستاذ
                </label>
                <input
                  id="tea-personal-ccp"
                  type="text"
                  maxLength={60}
                  value={teacherPersonalCcp}
                  onChange={(e) => setTeacherPersonalCcp(e.target.value)}
                  placeholder="مثال: 0098765432 المفتاح 12"
                  className="w-full bg-darknavy border border-gold/40 rounded-xl px-3 py-2 text-xs text-gold-royal font-mono font-bold focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            {/* Toggleable Teaching Subject Picker inside Teacher Info */}
            {subjectPickerOpen && (
              <div className="bg-darknavy/95 p-4 rounded-2xl border-2 border-turquoise-400/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-turquoise-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-gold-royal" />
                    <span>اختيار مادة التدريس الخاصة بالأستاذ</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSubjectPickerOpen(false)}
                    aria-label="إغلاق اختيار مادة التدريس"
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map((sub) => {
                    const isActive = teacherTeachingSubject === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setTeacherTeachingSubject(sub);
                          setSubject(sub);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 active:scale-95 cursor-pointer ${
                          isActive
                            ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_12px_rgba(255,215,0,0.4)] font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-turquoise-400/60 hover:text-turquoise-200'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label htmlFor="tea-custom-subject" className="block text-[11px] font-bold text-slate-300 mb-1">
                    أو اكتب اسم المادة يدوياً
                  </label>
                  <input
                    id="tea-custom-subject"
                    type="text"
                    maxLength={80}
                    value={teacherTeachingSubject}
                    onChange={(e) => setTeacherTeachingSubject(e.target.value)}
                    placeholder="مثال: الرياضيات — بكالوريا"
                    className="w-full bg-slate-900 border border-turquoise-500/40 rounded-xl px-3 py-2 text-xs text-turquoise-200 font-bold focus:border-turquoise-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubjectPickerOpen((prev) => !prev)}
                aria-expanded={subjectPickerOpen}
                className={`px-4 py-2.5 rounded-xl text-xs font-black border inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
                  subjectPickerOpen
                    ? 'turquoise-gradient text-white border-turquoise-300 shadow-[0_0_16px_rgba(20,184,166,0.45)]'
                    : 'bg-darknavy hover:bg-turquoise-500/15 text-turquoise-300 border-turquoise-400/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>مادة التدريس: {teacherTeachingSubject || 'اختر المادة'}</span>
              </button>

              <button
                type="submit"
                disabled={isSavingCard}
                className="px-5 py-2.5 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 disabled:opacity-60 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingCard ? 'جاري الحفظ...' : 'حفظ معلومات الأستاذ'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top Row: Attendance + Teacher CCP Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 surface-sub p-5 rounded-2xl space-y-4">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-3 gap-2">
            <h3 className="font-bold text-turquoise-300 text-sm">
              إحصائيات التلاميذ المسجلين والحاضرين والغائبين
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void onMarkPresent()}
                className="px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/45 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>حضور تلميذ</span>
              </button>
              <button
                type="button"
                onClick={() => void onEnroll()}
                className="px-3 py-1.5 bg-gold/15 hover:bg-gold/25 text-gold-royal border border-gold/45 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>مسجل جديد</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-darknavy/95 p-4 rounded-xl border border-gold/35">
              <span className="text-[11px] text-slate-400 block">التلاميذ المسجلين</span>
              <span className="text-2xl font-black text-white mt-1 block tabular-nums">
                {activeMeta.reg} / {activeMeta.max === null ? '∞' : activeMeta.max}
              </span>
            </div>
            <div className="bg-darknavy/95 p-4 rounded-xl border border-emerald-500/35">
              <span className="text-[11px] text-slate-400 block">التلاميذ الحاضرين</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block tabular-nums">
                {activeMeta.pres}
              </span>
            </div>
            <div className="bg-darknavy/95 p-4 rounded-xl border border-rose-500/35">
              <span className="text-[11px] text-slate-400 block">التلاميذ الغائبين</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block tabular-nums">
                {absentCount}
              </span>
            </div>
          </div>

          <div className="bg-darknavy/85 p-3.5 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center text-xs gap-2">
            <span className="text-slate-300">
              القسم النشط: <strong className="text-gold-royal">{state.activeSection}</strong>
            </span>
            <button
              type="button"
              onClick={onOpenRoster}
              className="text-turquoise-300 hover:text-gold-royal font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>فتح قائمة الحضور والغياب ({state.roster.length})</span>
            </button>
          </div>
        </div>

        {/* Teacher Wallet */}
        <div className="lg:col-span-5 surface-sub p-5 rounded-2xl border border-gold/35 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700/70 pb-2.5">
              <h3 className="font-bold text-gold-royal text-sm flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>محفظة الأستاذ ({state.teacherSharePct}% مؤكدة من كل اشتراك)</span>
              </h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={60}
                value={ccpInput}
                onChange={(e) => setCcpInput(e.target.value)}
                placeholder="أدخل رقم CCP الأستاذ"
                className="flex-grow bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void onSaveTeacherCcp(ccpInput)}
                className="px-4 py-2 royal-gold-gradient text-darknavy font-black rounded-xl text-xs whitespace-nowrap cursor-pointer hover:brightness-105 transition"
              >
                حفظ CCP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-darknavy p-3 rounded-xl border border-gold/35">
            <div className="py-1">
              <span className="text-[10px] text-slate-400 block">الاشتراكات المعتمدة</span>
              <span className="text-xs font-bold text-white tabular-nums mt-0.5 block">
                {formatDzd(approvedGross)}
              </span>
            </div>
            <div className="py-1">
              <span className="text-[10px] text-turquoise-300 block">
                حصة المنصة ({state.platformSharePct}%)
              </span>
              <span className="text-xs font-bold text-turquoise-300 tabular-nums mt-0.5 block">
                {formatDzd(platformShareAmount)}
              </span>
            </div>
            <div className="bg-gold/15 rounded-lg py-1 border border-gold/40">
              <span className="text-[10px] text-gold-royal font-bold block">
                الأرباح المؤكدة ({state.teacherSharePct}%)
              </span>
              <span className="text-sm font-black text-gold-royal tabular-nums mt-0.5 block">
                {formatDzd(teacherShareAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onRequestPayout()}
            className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/45 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>طلب سحب الأرباح المؤكدة إلى CCP الأستاذ</span>
          </button>

          {state.payouts.length > 0 && (
            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
              آخر طلب سحب:{' '}
              <strong className="text-emerald-300 tabular-nums">
                {formatDzd(state.payouts[0].amount)}
              </strong>{' '}
              بتاريخ {state.payouts[0].date} ({state.payouts[0].status})
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Publish Lesson + Student Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={(e) => void handleCreateLesson(e)}
          className="lg:col-span-7 surface-sub p-5 rounded-2xl space-y-4"
        >
          <h3 className="font-bold text-turquoise-300 text-sm border-b border-slate-700/70 pb-2.5">
            اختيار طريقة التدريس ونشر الدروس والوثائق
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="tea-level" className="block text-xs text-slate-300 mb-1">
                المستوى الدراسي
              </label>
              <select
                id="tea-level"
                value={level}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tea-stream" className="block text-xs text-slate-300 mb-1">
                الشعبة
              </label>
              <select
                id="tea-stream"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              >
                {availableStreams.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tea-subject" className="block text-xs text-slate-300 mb-1">
                المادة
              </label>
              <select
                id="tea-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
              >
                {SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-bold text-gold-royal">
              اختر وسيلة الاتصال وتقديم الدرس:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEACHING_METHODS.map((m) => {
                const active = method === m;
                const meta = METHOD_APP_CONFIG[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black border transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-gold-royal royal-gold-gradient text-darknavy shadow-[0_0_16px_rgba(255,215,0,0.45)]'
                        : 'border-slate-700 bg-darknavy text-slate-300 hover:border-turquoise-400/60 hover:text-turquoise-200'
                    }`}
                  >
                    {methodIcon(m)}
                    <span>{m === 'دروس مسجلة' ? m : meta.arLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Action Bar for the Selected Communication Method */}
            <div className="bg-darknavy/95 p-4 rounded-2xl border-2 border-gold/45 space-y-3 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg royal-gold-gradient text-darknavy flex items-center justify-center shrink-0">
                    {methodIcon(method)}
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-gold-royal">
                      وسيلة الاتصال المختارة: {activeMethodMeta.arLabel} ({method})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      أرسل رابط الحصة فوراً إلى بوابة التلميذ أو ادخل إلى التطبيق مباشرة.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="tea-quick-link" className="block text-[11px] font-bold text-slate-300 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-turquoise-300" />
                    <span>رابط {activeMethodMeta.arLabel} المراد إرساله للتلميذ:</span>
                  </span>
                </label>
                <input
                  id="tea-quick-link"
                  type="text"
                  inputMode="url"
                  maxLength={300}
                  value={currentLink}
                  onChange={(e) => setCurrentLink(e.target.value)}
                  placeholder={activeMethodMeta.placeholder}
                  dir="ltr"
                  className="w-full bg-slate-950/90 border border-turquoise-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isSendingLink}
                  onClick={() => void handleSendLinkToStudent()}
                  className="py-2.5 px-3.5 royal-gold-gradient hover:brightness-105 text-darknavy font-black rounded-xl text-xs shadow-md transition-all duration-150 active:scale-95 disabled:opacity-60 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>
                    {isSendingLink
                      ? 'جاري إرسال الرابط...'
                      : `إرسال رابط ${activeMethodMeta.arLabel} للتلميذ`}
                  </span>
                </button>

                <a
                  href={directAppTarget.href}
                  target={directAppTarget.openInNewTab ? '_blank' : undefined}
                  rel={directAppTarget.openInNewTab ? 'noopener noreferrer' : undefined}
                  className={`py-2.5 px-3.5 rounded-xl text-xs font-black border transition-all duration-150 active:scale-95 inline-flex items-center justify-center gap-1.5 ${activeMethodMeta.openBtnClass}`}
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{activeMethodMeta.openAppLabel}</span>
                </a>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="tea-title" className="block text-xs text-slate-300 mb-1">
              عنوان الحصة / الدرس
            </label>
            <input
              id="tea-title"
              type="text"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة شاملة في الدوال"
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
          </div>

          <div className="bg-darknavy/90 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-grow min-w-0">
              <span className="block text-xs font-bold text-turquoise-300 mb-1.5">
                تحميل الملفات والوثائق من الهاتف أو الحاسوب:
              </span>
              <label
                htmlFor="tea-doc-file"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-turquoise-800/70 hover:bg-turquoise-700 text-white text-xs font-bold cursor-pointer transition max-w-full"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{docName || 'اختر ملف PDF أو ملخص الدرس'}</span>
              </label>
              <input
                ref={fileRef}
                id="tea-doc-file"
                type="file"
                onChange={(e) => setDocName(e.target.files?.[0]?.name?.slice(0, 140) ?? '')}
                className="hidden"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-gold-royal font-bold cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="w-4 h-4 accent-gold cursor-pointer"
              />
              <span>السماح للتلاميذ والأولياء بالتحميل</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 turquoise-gradient hover:brightness-110 text-white font-black rounded-xl text-xs shadow-lg transition inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>نشر الدرس وإرساله آنياً للتلاميذ والأولياء</span>
          </button>
        </form>

        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={(e) => void handleIssueCert(e)}
            className="surface-sub p-5 rounded-2xl border border-gold/35 space-y-3"
          >
            <h3 className="font-bold text-gold-royal text-sm border-b border-slate-700/70 pb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>تقديم الشهادات والتكريمات للتلاميذ</span>
            </h3>
            <input
              type="text"
              maxLength={100}
              value={certStudent}
              onChange={(e) => setCertStudent(e.target.value)}
              placeholder="الاسم الكامل للتلميذ المتفوق"
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
            <input
              type="text"
              maxLength={240}
              value={certReason}
              onChange={(e) => setCertReason(e.target.value)}
              placeholder="سبب التكريم (مثال: المرتبة الأولى في الفرض)"
              className="w-full bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 royal-gold-gradient text-darknavy font-black rounded-xl text-xs shadow hover:brightness-105 transition cursor-pointer"
            >
              إصدار شهادة تقدير وتكريم للتلميذ
            </button>
          </form>

          <div className="surface-sub p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700/70 pb-2.5">
              <h3 className="font-bold text-turquoise-300 text-sm">
                الدروس المنشورة حالياً ({state.lessons.length})
              </h3>
            </div>

            {state.lessons.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                لا توجد دروس منشورة بعد. انشر أول درس من النموذج المقابل.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pl-1">
                {state.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-darknavy/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{lesson.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {lesson.level} · {lesson.subject} · {lesson.method}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void onToggleLessonDownload(lesson.id, !lesson.allowDownload)}
                        title={
                          lesson.allowDownload
                            ? 'التحميل مفتوح — اضغط للإغلاق'
                            : 'التحميل مغلق — اضغط للفتح'
                        }
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          lesson.allowDownload
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {lesson.allowDownload ? (
                          <Download className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteLesson(lesson.id)}
                        title="حذف الدرس"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
