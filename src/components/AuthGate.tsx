import React from 'react';
import {
  Crown,
  GraduationCap,
  Lock,
  LogIn,
  MessageCircle,
  ShieldCheck,
  ShieldUser,
} from 'lucide-react';
import { PlatformState, SectionType } from '../types';
import {
  SECTION_TYPES,
  WHATSAPP_NUMBER_DISPLAY,
  buildWhatsAppLink,
  formatDzd,
} from '../data/initialData';

interface AuthGateProps {
  state: PlatformState;
  preferredRole: 'student' | 'parent';
  onChangePreferredRole: (role: 'student' | 'parent') => void;
  onSignIn: () => void;
  isSigningIn: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  state,
  preferredRole,
  onChangePreferredRole,
  onSignIn,
  isSigningIn,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      <div className="surface-panel rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Welcome & Security Explanation */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>حماية سحابية مفعّلة عبر Firebase Auth و Firestore Security Rules</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-4xl font-black text-gold-royal leading-tight [text-wrap:balance]">
              منصة النبراس التعليمية
            </h1>
            <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/55 text-gold-light px-4 py-1.5 rounded-xl text-sm sm:text-base font-black shadow-sm">
              <Crown className="w-4 h-4 text-gold-royal shrink-0" />
              <span>تحت إشراف الأستاذة ليلى</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            بيئة تعليمية مؤمّنة من التحضيري إلى البكالوريا. لحماية بيانات التلاميذ والأولياء ووصلات الدفع، يتطلب الوصول إلى الدروس ورفع وصلات التحويل تسجيل الدخول بحساب Google موثّق.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {SECTION_TYPES.map((sec: SectionType) => {
              const meta = state.sectionsMeta[sec];
              return (
                <div
                  key={sec}
                  className="bg-darknavy/90 p-3.5 rounded-xl border border-gold/25 space-y-1"
                >
                  <div className="text-xs font-bold text-white">{meta.shortLabel}</div>
                  <div className="text-[11px] text-slate-400">{meta.badgeText}</div>
                  <div className="pt-1.5 space-y-0.5 tabular-nums">
                    <div className="text-sm font-black text-gold-royal">
                      {formatDzd(state.prices[sec])}{' '}
                      <span className="text-[10px] font-semibold text-slate-400">/ شهر</span>
                    </div>
                    <div className="text-xs font-extrabold text-turquoise-300">
                      {formatDzd(state.annualPrices[sec])}{' '}
                      <span className="text-[10px] font-semibold text-slate-400">/ سنة</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-300 bg-darknavy/80 p-3.5 rounded-xl border border-slate-800 flex flex-wrap gap-x-5 gap-y-1.5">
            <span>
              CCP الإدارة:{' '}
              <strong className="text-gold-royal font-mono" dir="ltr">
                {state.ccp}
              </strong>
            </span>
            <span>
              بريدي موب:{' '}
              <strong className="text-turquoise-300 font-mono" dir="ltr">
                {state.baridi}
              </strong>
            </span>
          </div>
        </div>

        {/* Sign-in Action Card */}
        <div className="lg:col-span-5 surface-sub rounded-2xl p-6 border border-gold/40 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl royal-gold-gradient text-darknavy flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">تسجيل الدخول الآمن</h2>
              <p className="text-[11px] text-slate-400">
                اختر صفتك عند أول تسجيل دخول (صلاحيات الإدارة والأساتذة تُمنح من المديرة فقط)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChangePreferredRole('student')}
              className={`group p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                preferredRole === 'student'
                  ? 'border-2 border-gold-royal bg-gold/15 text-gold-royal shadow-[0_0_18px_rgba(255,215,0,0.2)]'
                  : 'border-slate-700 bg-darknavy text-slate-300 hover:border-slate-500'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  preferredRole === 'student'
                    ? 'royal-gold-gradient text-darknavy shadow-[0_0_16px_rgba(255,215,0,0.6)] scale-105'
                    : 'bg-slate-800/90 text-slate-400 group-hover:text-gold-royal'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold">حساب تلميذ</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePreferredRole('parent')}
              className={`group p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                preferredRole === 'parent'
                  ? 'border-2 border-turquoise-400 bg-turquoise-500/15 text-turquoise-300 shadow-[0_0_18px_rgba(38,198,218,0.2)]'
                  : 'border-slate-700 bg-darknavy text-slate-300 hover:border-slate-500'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  preferredRole === 'parent'
                    ? 'bg-turquoise-400 text-darknavy shadow-[0_0_16px_rgba(38,198,218,0.6)] scale-105'
                    : 'bg-slate-800/90 text-slate-400 group-hover:text-turquoise-300'
                }`}
              >
                <ShieldUser className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold">حساب ولي أمر</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 royal-gold-gradient text-darknavy font-black rounded-xl text-sm shadow-lg hover:brightness-105 disabled:opacity-60 transition inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {isSigningIn ? 'جاري التحقق من الحساب...' : 'تسجيل الدخول بحساب Google'}
            </span>
          </button>

          <div className="text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed pt-1 border-t border-slate-800">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              كل وصل دفع وبيانات تلميذ معزولة برمجياً في السحابة ولا يمكن لغير صاحبها أو الإدارة المعتمدة الاطلاع عليها.
            </span>
          </div>

          <a
            href={buildWhatsAppLink('السلام عليكم إدارة منصة النبراس التعليمية، أحتاج مساعدة في التسجيل')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>
              مساعدة مباشرة عبر واتساب: <span dir="ltr">{WHATSAPP_NUMBER_DISPLAY}</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
