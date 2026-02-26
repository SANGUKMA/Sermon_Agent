import { canMakeAICall, logUsage, fetchSubscriptionState, type SubscriptionState } from './subscriptionService';

export class UsageLimitError extends Error {
  constructor() {
    super('이번 달 무료 AI 사용 횟수(5회)를 모두 사용했습니다. 프로 플랜으로 업그레이드하면 무제한으로 사용할 수 있습니다.');
    this.name = 'UsageLimitError';
  }
}

let stateCache: SubscriptionState | null = null;

export async function withUsageTracking<T>(
  functionName: string,
  fn: () => Promise<T>,
  cachedState?: SubscriptionState | null
): Promise<T> {
  // 사용량 확인
  const state = cachedState || stateCache || await fetchSubscriptionState();
  stateCache = state;

  if (!canMakeAICall(state)) {
    throw new UsageLimitError();
  }

  // 사용량 기록
  await logUsage(functionName);

  // AI 호출 실행
  return fn();
}

export function updateCachedState(state: SubscriptionState | null): void {
  stateCache = state;
}
