import React from 'react';
import {
  Check,
  Copy,
  Crown,
  GraduationCap,
  Layers,
  Lock,
  Presentation,
  ShieldUser,
} from 'lucide-react';
import { BillingCycle, PortalTab, SectionType } from '../types';
import { formatDzd } from '../data/initialData';

interface PortalNavProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  ccp: string;
  baridi: string;
  activeSection: SectionType;
  billingCycle: BillingCycle;
  activeSectionPrice: number;
  pendingReceiptsCount: number;
  isTeacher: boolean;
  isAdmin: boolean;
  onCopyText: (label: string, value: string) => void;
}

export const PortalNav: React.FC<PortalNavProps> = ({
  activeTab,
  onSelectTab,
  ccp,
  baridi,
  activeSection,
  billingCycle,
  activeSectionPrice,
  pendingReceiptsCount,
  isTeacher,
  isAdmin,
  onCopyText,
}) => {
  const [copiedField, setCopiedField] = React.useState<'ccp' | 'baridi' | null>(null);

  const handleCopy = (field: 'ccp' | 'baridi', label: string, value: string) => {
    onCopyText(label, value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1600);
  };

  const shortSectionName = activeSection.split('(')[0].trim();

  const items: {
    id: PortalTab;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    inactiveIconClass: string;
    activeIconClass: string;
    activeCardClass: string;
    activeBarClass: string;
    activeTitleClass: string;
    locked?: boolean;
    spanClass?: string;
  }[] = [
    {
      id: 'student',
      title: 'أيقونة التلاميذ',
      subtitle: 'الدروس، البث المباشر والوثائق',
      icon: <GraduationCap className="w-6 h-6" />,
      inactiveIconClass:
        'bg-darknavy border border-slate-700/90 text-slate-300 group-hover:border-emerald-400/60 group-hover:text-emerald-300',
      activeIconClass:
        'bg-emerald-400 text-darknavy ring-2 ring-emerald-200/80 shadow-[0_0_22px_rgba(52,211,153,0.65)] scale-110',
      activeCardClass:
        'border-2 border-emerald-400 bg-gradient-to-b from-emerald-500/20 to-darknavy/95 shadow-[0_0_26px_rgba(52,211,153,0.22)]',
      activeBarClass: 'bg-emerald-400',
      activeTitleClass: 'text-emerald-300',
    },
    {
      id: 'parent',
      title: 'أيقونة الأولياء',
      subtitle: 'متابعة تقدم الأبناء والحضور',
      icon: <ShieldUser className="w-6 h-6" />,
      inactiveIconClass:
        'bg-darknavy border border-slate-700/90 text-slate-300 group-hover:border-turquoise-400/60 group-hover:text-turquoise-300',
      activeIconClass:
        'bg-turquoise-400 text-darknavy ring-2 ring-turquoise-200/80 shadow-[0_0_22px_rgba(38,198,218,0.65)] scale-110',
      activeCardClass:
        'border-2 border-turquoise-400 bg-gradient-to-b from-turquoise-500/20 to-darknavy/95 shadow-[0_0_26px_rgba(38,198,218,0.22)]',
      activeBarClass: 'bg-turquoise-400',
      activeTitleClass: 'text-turquoise-300',
    },
    {
      id: 'teacher',
      title: 'أيقونة الأساتذة',
      subtitle: isTeacher ? 'تقديم الدروس، CCP والتكريم' : 'محمية — للأساتذة المعتمدين فقط',
      icon: isTeacher ? <Presentation className="w-6 h-6" /> : <Lock className="w-5 h-5" />,
      inactiveIconClass: isTeacher
        ? 'bg-darknavy border border-slate-700/90 text-slate-300 group-hover:border-gold/60 group-hover:text-gold-royal'
        : 'bg-slate-900 border border-slate-700 text-slate-400 group-hover:border-rose-400/50 group-hover:text-rose-300',
      activeIconClass: isTeacher
        ? 'royal-gold-gradient text-darknavy ring-2 ring-amber-200/85 shadow-[0_0_22px_rgba(255,215,0,0.65)] scale-110'
        : 'bg-rose-500 text-white ring-2 ring-rose-300/80 shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-110',
      activeCardClass: isTeacher
        ? 'border-2 border-gold-royal bg-gradient-to-b from-gold/20 to-darknavy/95 shadow-[0_0_26px_rgba(212,175,55,0.26)]'
        : 'border-2 border-rose-400 bg-gradient-to-b from-rose-500/20 to-darknavy/95 shadow-[0_0_24px_rgba(244,63,94,0.2)]',
      activeBarClass: isTeacher ? 'bg-gold-royal' : 'bg-rose-400',
      activeTitleClass: isTeacher ? 'text-gold-royal' : 'text-rose-300',
      locked: !isTeacher,
    },
    {
      id: 'admin',
      title: 'مدير المنصة',
      subtitle: !isAdmin
        ? 'محمية — للإدارة العليا فقط'
        : pendingReceiptsCount > 0
        ? `${pendingReceiptsCount} وصلات بانتظار المراجعة`
        : 'التحكم الشامل، الأسعار والأدمن',
      icon: isAdmin ? <Crown className="w-6 h-6" /> : <Lock className="w-5 h-5" />,
      inactiveIconClass: isAdmin
        ? 'bg-darknavy border border-slate-700/90 text-slate-300 group-hover:border-amber-400/60 group-hover:text-amber-300'
        : 'bg-slate-900 border border-slate-700 text-slate-400 group-hover:border-rose-400/50 group-hover:text-rose-300',
      activeIconClass: isAdmin
        ? 'bg-amber-400 text-darknavy ring-2 ring-amber-100/85 shadow-[0_0_22px_rgba(251,191,36,0.65)] scale-110'
        : 'bg-rose-500 text-white ring-2 ring-rose-300/80 shadow-[0_0_20px_rgba(244,63,94,0.6)] scale-110',
      activeCardClass: isAdmin
        ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 to-darknavy/95 shadow-[0_0_26px_rgba(251,191,36,0.26)]'
        : 'border-2 border-rose-400 bg-gradient-to-b from-rose-500/20 to-darknavy/95 shadow-[0_0_24px_rgba(244,63,94,0.2)]',
      activeBarClass: isAdmin ? 'bg-amber-400' : 'bg-rose-400',
      activeTitleClass: isAdmin ? 'text-amber-300' : 'text-rose-300',
      locked: !isAdmin,
    },
    {
      id: 'sections',
      title: 'أيقونة نوع القسم',
      subtitle: `${shortSectionName} · ${formatDzd(activeSectionPrice)} (${
        billingCycle === 'annual' ? 'سنوي' : 'شهري'
      })`,
      icon: <Layers className="w-6 h-6" />,
      inactiveIconClass:
        'bg-darknavy border border-slate-700/90 text-slate-300 group-hover:border-gold/60 group-hover:text-gold-royal',
      activeIconClass:
        'bg-gradient-to-br from-emerald-400 via-turquoise-400 to-gold text-darknavy ring-2 ring-gold-royal/85 shadow-[0_0_22px_rgba(38,198,218,0.65)] scale-110',
      activeCardClass:
        'border-2 border-gold-royal bg-gradient-to-b from-turquoise-500/20 via-gold/15 to-darknavy/95 shadow-[0_0_26px_rgba(212,175,55,0.26)]',
      activeBarClass: 'bg-gradient-to-r from-turquoise-400 to-gold-royal',
      activeTitleClass: 'text-gold-royal',
      spanClass: 'col-span-2 sm:col-span-1',
    },
  ];

  return (
    <section aria-label="الأيقونات الخمس الرئيسية للمنصة" className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 px-1">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-gold-royal">
            اختر بوابتك للوصول الفوري
          </h2>
          <p className="text-xs text-slate-400">
            مزامنة سحابية فورية ومحمية بصلاحيات الحساب (RBAC)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300 bg-darknavy/80 px-4 py-2 rounded-xl border border-gold/25">
          <button
            type="button"
            onClick={() => handleCopy('ccp', 'رقم CCP المنصة', ccp)}
            className="inline-flex items-center gap-1.5 hover:text-gold-royal transition-colors cursor-pointer"
            title="اضغط لنسخ رقم CCP"
          >
            <span className="text-slate-400">CCP المنصة:</span>
            <strong className="text-gold-royal font-mono tabular-nums" dir="ltr">
              {ccp}
            </strong>
            {copiedField === 'ccp' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          <span className="hidden sm:inline text-slate-700" aria-hidden="true">
            |
          </span>

          <button
            type="button"
            onClick={() => handleCopy('baridi', 'رقم بريدي موب المنصة', baridi)}
            className="inline-flex items-center gap-1.5 hover:text-turquoise-300 transition-colors cursor-pointer"
            title="اضغط لنسخ رقم بريدي موب"
          >
            <span className="text-slate-400">بريدي موب:</span>
            <strong className="text-turquoise-300 font-mono tabular-nums" dir="ltr">
              {baridi}
            </strong>
            {copiedField === 'baridi' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-pressed={isActive}
              className={`${item.spanClass ?? ''} group relative overflow-hidden surface-panel p-4 rounded-2xl text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-royal ${
                isActive
                  ? item.activeCardClass
                  : item.locked
                  ? 'opacity-80 hover:opacity-100 border-slate-800 hover:border-rose-400/40'
                  : 'hover:border-gold/55'
              }`}
            >
              {/* Active top accent bar */}
              <span
                aria-hidden="true"
                className={`absolute top-0 inset-x-0 h-1 transition-opacity duration-200 ${
                  isActive ? `${item.activeBarClass} opacity-100` : 'opacity-0'
                }`}
              />

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-200 group-active:scale-90 ${
                  isActive ? item.activeIconClass : item.inactiveIconClass
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-sm sm:text-base font-black whitespace-nowrap transition-colors duration-200 ${
                  isActive ? item.activeTitleClass : 'text-white'
                }`}
              >
                {item.title}
              </span>
              <span
                className={`text-[11px] mt-1 leading-snug transition-colors duration-200 ${
                  item.id === 'admin' && isAdmin && pendingReceiptsCount > 0
                    ? 'text-amber-300 font-bold'
                    : isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {item.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
