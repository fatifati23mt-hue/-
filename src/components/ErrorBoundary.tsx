import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isQuotaError: false,
      isPermissionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'حدث خطأ غير متوقع في المنصة.';
    const isQuotaError =
      raw.includes('Quota exceeded') || raw.includes('Free daily read units');
    const isPermissionError =
      raw.includes('Missing or insufficient permissions') ||
      raw.includes('permission-denied');

    return {
      hasError: true,
      message: raw,
      isQuotaError,
      isPermissionError,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Nibras ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const upgradeUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#07111e] text-slate-100">
        <div className="surface-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-rose-500/40 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-gold-royal">
            {this.state.isPermissionError
              ? 'تم حظر العملية بواسطة قواعد الأمان'
              : this.state.isQuotaError
              ? 'تم بلوغ الحد اليومي لقاعدة البيانات'
              : 'تعذّر إتمام العملية'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {this.state.isPermissionError
              ? 'لا يملك حسابك الحالي الصلاحية المطلوبة لهذه العملية في قاعدة البيانات السحابية. إذا كنتِ مديرة المنصة، يرجى تسجيل الدخول بحساب الإدارة المعتمد.'
              : this.state.isQuotaError
              ? 'تم بلوغ حصة القراءة اليومية المجانية في Firestore. سيتم تجديد الحصة تلقائياً غداً أو يمكنك ترقية الخطة من لوحة Firebase.'
              : 'حدث خطأ تقني مؤقت أثناء الاتصال بقاعدة البيانات. يمكنك إعادة تحميل الصفحة للمتابعة بأمان.'}
          </p>

          {this.state.isQuotaError && (
            <a
              href={upgradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-turquoise-700/30 border border-turquoise-400/50 text-turquoise-200 rounded-xl text-xs font-bold"
            >
              فتح إعدادات قاعدة البيانات في Firebase Console
            </a>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 royal-gold-gradient text-darknavy font-black rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تحميل المنصة</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
