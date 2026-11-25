import React from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Check,
  Layers,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { BillingCycle, PlatformState, PortalTab, SectionType } from '../types';
import { SECTION_TYPES, formatDzd } from '../data/initialData';

interface SectionsPortalProps {
  state: PlatformState;
  onSelectSection: (section: SectionType, cycle?: BillingCycle) => void;
  onSelectBillingCycle: (cycle: BillingCycle) => void;
  onNavigate: (tab: PortalTab) => void;
}

export const SectionsPortal: React.FC<SectionsPortalProps> = ({
  state,
  onSelectSection,
  onSelectBillingCycle,
  onNavigate,
}) => {
  const icons: Record<SectionType, React.ReactNode> = {
    'قسم خاص فردي': <User className="w-6 h-6" />,
    'قسم مجموعة مصغرة (8-10 تلاميذ)': <UserPlus className="w-6 h-6" />,
    'قسم جماعي (عدد غير محدود)': <Users className="w-6 h-6" />,
  };

  return (
    <section className="surface-panel rounded-3xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap justify-between items-center border-b border-slate-700/70 pb-4 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gold-royal flex items-center gap-2">
            <Layers className="w-6 h-6 text-turquoise-400 shrink-0" />
            <span>اختيار نوع القسم ونظام الاشتراك (شهري أو سنوي)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            اختر نوع القسم ومدة الاشتراك (شهري أو سنوي)؛ ينعكس اختيارك مباشرة على السعر في بوابات التلاميذ والأولياء والوصل.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div
          role="group"
          aria-label="اختيار مدة الاشتراك"
          className="inline-flex items-center gap-1.5 bg-darknavy p-1.5 rounded-2xl border border-gold/40"
        >
          <button
            type="button"
            onClick={() => onSelectBillingCycle('monthly')}
            aria-pressed={state.billingCycle === 'monthly'}
            className={`px-3.5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
              state.billingCycle === 'monthly'
                ? 'turquoise-gradient text-white shadow-[0_0_14px_rgba(38,198,218,0.45)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>اشتراك شهري</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectBillingCycle('annual')}
            aria-pressed={state.billingCycle === 'annual'}
            className={`px-3.5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
              state.billingCycle === 'annual'
                ? 'royal-gold-gradient text-darknavy shadow-[0_0_16px_rgba(255,215,0,0.5)]'
                : 'text-slate-300 hover:text-gold-royal'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>اشتراك سنوي (الأوفر)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SECTION_TYPES.map((sec, idx) => {
          const meta = state.sectionsMeta[sec];
          const monthlyPrice = state.prices[sec];
          const annualPrice = state.annualPrices[sec];
          const isSelected = state.activeSection === sec;
          const occupancyPct =
            meta.max !== null ? Math.min(100, Math.round((meta.reg / meta.max) * 100)) : 45;
          const yearlyBaseline = monthlyPrice * 10;
          const annualSaving = Math.max(0, yearlyBaseline - annualPrice);

          return (
            <div
              key={sec}
              onClick={() => onSelectSection(sec)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSection(sec);
                }
              }}
              className={`group surface-sub p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-royal ${
                isSelected
                  ? 'border-2 border-gold-royal bg-gradient-to-b from-gold/15 to-darknavy/95 shadow-[0_0_24px_rgba(212,175,55,0.24)]'
                  : 'hover:border-gold/50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-active:scale-90 ${
                      isSelected
                        ? idx === 1
                          ? 'bg-turquoise-400 text-darknavy ring-2 ring-turquoise-200/80 shadow-[0_0_20px_rgba(38,198,218,0.65)] scale-110'
                          : 'royal-gold-gradient text-darknavy ring-2 ring-amber-200/85 shadow-[0_0_20px_rgba(255,215,0,0.65)] scale-110'
                        : 'bg-darknavy border border-slate-700 text-slate-300 group-hover:border-gold/50 group-hover:text-gold-royal'
                    }`}
                  >
                    {icons[sec]}
                  </div>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isSelected ? 'text-gold-royal' : 'text-turquoise-300'
                    }`}
                  >
                    {meta.badgeText}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {idx + 1}. {meta.shortLabel}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">{meta.summary}</p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                    <span>المسجلون حالياً</span>
                    <span className="text-slate-200 font-bold">
                      {meta.reg} {meta.max !== null ? `/ ${meta.max}` : '(مفتوح)'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-darknavy rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        idx === 1 ? 'turquoise-gradient' : 'royal-gold-gradient'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Dual Monthly + Annual Selectable Pricing Boxes */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSection(sec, 'monthly');
                    }}
                    className={`p-3 rounded-xl border text-right transition-all duration-200 active:scale-95 cursor-pointer ${
                      isSelected && state.billingCycle === 'monthly'
                        ? 'border-2 border-turquoise-400 bg-turquoise-500/20 shadow-[0_0_14px_rgba(38,198,218,0.28)]'
                        : 'border-slate-700/90 bg-darknavy/90 hover:border-turquoise-400/60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-turquoise-300 shrink-0" />
                      <span>الاشتراك الشهري</span>
                    </span>
                    <span className="text-base sm:text-lg font-black text-turquoise-300 tabular-nums block mt-1">
                      {formatDzd(monthlyPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">لكل شهر دراسي</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSection(sec, 'annual');
                    }}
                    className={`p-3 rounded-xl border text-right transition-all duration-200 active:scale-95 cursor-pointer ${
                      isSelected && state.billingCycle === 'annual'
                        ? 'border-2 border-gold-royal bg-gold/20 shadow-[0_0_16px_rgba(255,215,0,0.32)]'
                        : 'border-gold/35 bg-darknavy/90 hover:border-gold-royal/80'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gold-royal flex items-center gap-1">
                      <CalendarRange className="w-3 h-3 text-gold-royal shrink-0" />
                      <span>الاشتراك السنوي</span>
                    </span>
                    <span className="text-base sm:text-lg font-black text-gold-royal tabular-nums block mt-1">
                      {formatDzd(annualPrice)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold block tabular-nums">
                      {annualSaving > 0 ? `توفير ${formatDzd(annualSaving)}` : 'موسم دراسي كامل'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {isSelected
                      ? `مفعل (${state.billingCycle === 'annual' ? 'اشتراك سنوي' : 'اشتراك شهري'})`
                      : 'اضغط لاختيار القسم والاشتراك'}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${
                      isSelected
                        ? 'royal-gold-gradient text-darknavy'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>مختار حالياً</span>
                      </>
                    ) : (
                      <span>اختيار القسم</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-slate-800/80">
        <p className="text-xs text-slate-300">
          القسم المختار:{' '}
          <strong className="text-gold-royal">{state.activeSection}</strong> · النظام:{' '}
          <strong className="text-turquoise-300">
            {state.billingCycle === 'annual' ? 'اشتراك سنوي' : 'اشتراك شهري'}
          </strong>{' '}
          (
          <strong className="text-white tabular-nums">
            {formatDzd(
              state.billingCycle === 'annual'
                ? state.annualPrices[state.activeSection]
                : state.prices[state.activeSection]
            )}
          </strong>
          )
        </p>
        <button
          type="button"
          onClick={() => onNavigate('student')}
          className="px-4 py-2.5 turquoise-gradient text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 hover:brightness-110 transition cursor-pointer"
        >
          <span>الانتقال إلى بوابة التلاميذ لإتمام التسجيل</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
