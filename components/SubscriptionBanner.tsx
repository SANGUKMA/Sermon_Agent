import React from 'react';
import { Crown, Sparkles, AlertTriangle, CreditCard } from 'lucide-react';
import type { SubscriptionState } from '../services/subscriptionService';

interface SubscriptionBannerProps {
  state: SubscriptionState | null;
  onUpgrade: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ state, onUpgrade }) => {
  if (!state) return null;

  const { plan, status, usage, currentPeriodEnd, cancelledAt } = state;

  // 프로 또는 교회 플랜
  if (plan !== 'free') {
    const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString('ko-KR') : '';
    const isCancelled = status === 'cancelled';

    return (
      <div className={`rounded-sm border p-4 flex items-center justify-between ${
        isCancelled
          ? 'bg-amber-50 border-amber-200'
          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
      }`}>
        <div className="flex items-center gap-3">
          <Crown size={18} className={isCancelled ? 'text-amber-500' : 'text-indigo-600'} />
          <div>
            <span className="font-bold text-sm text-slate-900">
              {plan === 'pro' ? '프로' : '교회'} 플랜
            </span>
            <span className="text-xs text-slate-500 ml-2">
              무제한 AI 사용
            </span>
            {isCancelled && (
              <p className="text-xs text-amber-700 mt-0.5">
                해지 예정 — {periodEnd}까지 서비스가 유지됩니다
              </p>
            )}
          </div>
        </div>
        {!isCancelled && periodEnd && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CreditCard size={12} />
            다음 결제일: {periodEnd}
          </div>
        )}
      </div>
    );
  }

  // 무료 플랜
  const remaining = usage.limit - usage.currentMonth;
  const isNearLimit = remaining <= 2 && remaining > 0;
  const isOverLimit = remaining <= 0;

  return (
    <div className={`rounded-sm border p-4 flex items-center justify-between ${
      isOverLimit
        ? 'bg-red-50 border-red-200'
        : isNearLimit
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-3">
        {isOverLimit ? (
          <AlertTriangle size={18} className="text-red-500" />
        ) : isNearLimit ? (
          <AlertTriangle size={18} className="text-amber-500" />
        ) : (
          <Sparkles size={18} className="text-slate-400" />
        )}
        <div>
          <span className={`font-bold text-sm ${
            isOverLimit ? 'text-red-700' : isNearLimit ? 'text-amber-700' : 'text-slate-700'
          }`}>
            이번 달 AI 사용: {usage.currentMonth}/{usage.limit}회
          </span>
          {isOverLimit && (
            <p className="text-xs text-red-600 mt-0.5">
              무료 사용 횟수를 모두 사용했습니다
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className="bg-crimson hover:bg-crimson-hover text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wide transition-all shadow-sm flex items-center gap-2"
      >
        <Crown size={14} /> 업그레이드
      </button>
    </div>
  );
};
