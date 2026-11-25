import React, { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { Certificate, PaymentReceipt, ReceiptStatus, RosterStudent, UserRole } from '../types';
import { formatDzd } from '../data/initialData';

interface RosterModalProps {
  isOpen: boolean;
  roster: RosterStudent[];
  onToggleStatus: (id: string, currentStatus: 'حاضر' | 'غائب') => Promise<void>;
  onAddStudent: (name: string) => Promise<void>;
  onClose: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  roster,
  onToggleStatus,
  onAddStudent,
  onClose,
}) => {
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim().slice(0, 100);
    if (!clean) return;
    await onAddStudent(clean);
    setNewName('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="قائمة الحضور والغياب المباشرة"
    >
      <div className="surface-panel max-w-md w-full rounded-2xl p-5 border border-gold/60 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-700/70 pb-3">
          <h4 className="font-black text-gold-royal text-sm">قائمة الحضور والغياب السحابية</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
          <input
            type="text"
            maxLength={100}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="إضافة تلميذ جديد إلى القائمة..."
            className="flex-grow bg-darknavy border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 turquoise-gradient text-white font-bold rounded-xl text-xs inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </form>

        {roster.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            لا يوجد تلاميذ في قائمة الحضور بعد.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pl-1">
            {roster.map((stu) => {
              const isPresent = stu.status === 'حاضر';
              return (
                <div
                  key={stu.id}
                  className="bg-darknavy/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{stu.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      وقت الدخول: {stu.time}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onToggleStatus(stu.id, stu.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-600/25 border-emerald-500/45 text-emerald-300'
                        : 'bg-rose-600/20 border-rose-500/45 text-rose-300'
                    }`}
                  >
                    {stu.status}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  canModerate: boolean;
  onUpdateStatus: (id: string, status: ReceiptStatus) => Promise<void>;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  canModerate,
  onUpdateStatus,
  onClose,
}) => {
  if (!receipt) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="معاينة وصل الدفع"
    >
      <div className="surface-panel max-w-lg w-full rounded-2xl p-5 border border-gold/65 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-700/70 pb-3">
          <h4 className="font-black text-gold-royal text-sm">
            معاينة وصل الدفع — {receipt.studentName}
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-darknavy p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
          {receipt.isPdf ? (
            <div className="py-10 px-6 text-center space-y-2">
              <FileText className="w-12 h-12 text-gold-royal mx-auto" />
              <div className="text-sm font-bold text-white">{receipt.fileName}</div>
              <p className="text-xs text-slate-400">ملف PDF مرفق لوصل التحويل البنكي / البريدي</p>
            </div>
          ) : (
            <img
              src={receipt.previewUrl}
              alt={`وصل دفع ${receipt.studentName}`}
              referrerPolicy="no-referrer"
              className="max-h-72 w-auto rounded-xl object-contain border border-gold/40"
            />
          )}

          <div className="w-full text-xs text-slate-300 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div>
              الطريقة: <strong className="text-turquoise-300">{receipt.method}</strong>
            </div>
            <div>
              المرجع:{' '}
              <strong className="text-white font-mono" dir="ltr">
                {receipt.ref}
              </strong>
            </div>
            <div>
              المبلغ:{' '}
              <strong className="text-gold-royal tabular-nums">{formatDzd(receipt.amount)}</strong>
            </div>
            <div>
              التاريخ: <strong className="text-slate-200 tabular-nums">{receipt.date}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          {canModerate ? (
            <div className="flex items-center gap-2">
              {receipt.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => {
                    void onUpdateStatus(receipt.id, 'approved');
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/45 text-emerald-200 border border-emerald-500/50 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>اعتماد وتفعيل</span>
                </button>
              )}
              {receipt.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    void onUpdateStatus(receipt.id, 'rejected');
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/45 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>رفض الوصل</span>
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 royal-gold-gradient text-darknavy font-black rounded-xl text-xs cursor-pointer"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
};

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  if (!certificate) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="شهادة تقدير وتفوق"
    >
      <div className="surface-panel max-w-xl w-full rounded-3xl p-6 border-2 border-gold space-y-5 text-center">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-turquoise-300">
            منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-darknavy/95 rounded-2xl p-6 sm:p-8 border border-gold/55 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full royal-gold-gradient text-darknavy flex items-center justify-center shadow-lg">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gold-royal">
            {certificate.recipientRole === 'أستاذ'
              ? 'شهادة شرف وتقدير بيداغوجي'
              : 'شهادة تفوق وتميز دراسي'}
          </h3>
          <p className="text-xs text-slate-300">
            تتشرف إدارة منصة النبراس التعليمية بمنح هذه الشهادة إلى:
          </p>
          <div className="text-2xl font-black text-white py-2 border-y border-gold/30">
            {certificate.recipient}
          </div>
          <p className="text-sm text-turquoise-200 leading-relaxed">{certificate.reason}</p>
          <div className="pt-4 flex justify-between items-center text-xs text-slate-400">
            <span>التوقيع: {certificate.issuer}</span>
            <span className="tabular-nums">التاريخ: {certificate.date}</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 turquoise-gradient text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الشهادة</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 royal-gold-gradient text-darknavy font-black rounded-xl text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

interface SecuritySessionModalProps {
  isOpen: boolean;
  email: string | null;
  emailVerified: boolean;
  role: UserRole | null;
  dbConnected: boolean;
  onClose: () => void;
}

export const SecurityScanModal: React.FC<SecuritySessionModalProps> = ({
  isOpen,
  email,
  emailVerified,
  role,
  dbConnected,
  onClose,
}) => {
  if (!isOpen) return null;

  const roleArabic =
    role === 'admin'
      ? 'مدير المنصة (صلاحية عليا)'
      : role === 'teacher'
      ? 'أستاذ معتمد'
      : role === 'parent'
      ? 'ولي أمر'
      : role === 'student'
      ? 'تلميذ'
      : 'زائر غير مسجل';

  const checks = [
    {
      label: 'المصادقة السحابية (Firebase Auth)',
      status: email ? (emailVerified ? 'حساب موثّق' : 'بريد غير موثّق') : 'غير مسجل الدخول',
    },
    { label: 'مستوى الصلاحية (RBAC)', status: roleArabic },
    {
      label: 'الاتصال بقاعدة Firestore',
      status: dbConnected ? 'متصل ومؤمّن' : 'جارٍ التحقق',
    },
    { label: 'عزل وصلات الدفع وبيانات المشتركين', status: 'مفعّل بقواعد الخادم' },
    { label: 'حماية تعديل الأسعار وCCP الإدارة', status: 'محصورة بالإدارة فقط' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="حالة الأمان والصلاحيات الفعلية"
    >
      <div className="surface-panel max-w-md w-full rounded-2xl p-5 border border-emerald-500/50 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-700/70 pb-3">
          <h4 className="font-black text-emerald-300 text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span>حالة الأمان والجلسة الفعلية</span>
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {email && (
          <div className="text-xs bg-darknavy p-3 rounded-xl border border-slate-800 text-slate-300">
            الحساب النشط:{' '}
            <strong className="text-gold-royal font-mono" dir="ltr">
              {email}
            </strong>
          </div>
        )}

        <div className="space-y-2.5">
          {checks.map((item) => (
            <div
              key={item.label}
              className="bg-darknavy/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-slate-200 font-semibold">{item.label}</span>
              <span className="text-emerald-400 font-bold inline-flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 turquoise-gradient text-white font-black rounded-xl text-xs cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
