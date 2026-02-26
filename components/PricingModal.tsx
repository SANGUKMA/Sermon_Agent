import React, { useState } from 'react';
import { X, Crown, Check, Loader2, Church, Sparkles } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'pro' | 'church') => void;
  isProcessing?: boolean;
}

const PLANS = [
  {
    id: 'pro' as const,
    name: '프로 플랜',
    price: '19,900',
    icon: Crown,
    color: 'crimson',
    features: [
      '무제한 AI 설교 도우미',
      '모든 AI 기능 사용',
      '우선 응답 처리',
      '클라우드 동기화',
    ],
  },
  {
    id: 'church' as const,
    name: '교회 플랜',
    price: '49,900',
    icon: Church,
    color: 'indigo',
    features: [
      '프로 플랜의 모든 기능',
      '다중 사용자 지원 (예정)',
      '설교 아카이브 관리',
      '팀 협업 기능 (예정)',
      '우선 기술 지원',
    ],
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  isProcessing = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'church' | null>(null);

  if (!isOpen) return null;

  const handleSelect = (plan: 'pro' | 'church') => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl max-w-2xl w-full mx-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-serif flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              플랜 업그레이드
            </h2>
            <p className="text-sm text-slate-500 mt-1">AI 설교 도우미를 무제한으로 사용하세요</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Plan Info */}
        <div className="px-6 pt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 text-sm text-slate-600">
            현재 <span className="font-bold">무료 플랜</span>을 사용 중입니다. 월 5회 AI 호출이 가능합니다.
          </div>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`border-2 rounded-sm p-6 relative transition-all ${
                  isSelected
                    ? plan.color === 'crimson'
                      ? 'border-crimson bg-crimson-light/10'
                      : 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon
                    size={20}
                    className={plan.color === 'crimson' ? 'text-crimson' : 'text-indigo-600'}
                  />
                  <h3 className="font-bold text-lg text-slate-900 font-serif">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500">원/월</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check
                        size={14}
                        className={plan.color === 'crimson' ? 'text-crimson' : 'text-indigo-600'}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan.id)}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-sm font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    plan.color === 'crimson'
                      ? 'bg-crimson hover:bg-crimson-hover text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isProcessing && isSelected ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> 처리 중...
                    </>
                  ) : (
                    '카드 등록 및 결제'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-[10px] text-slate-400">
            결제는 토스페이먼츠를 통해 안전하게 처리됩니다. 언제든지 해지할 수 있으며, 현재 결제 기간 끝까지 서비스가 유지됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
