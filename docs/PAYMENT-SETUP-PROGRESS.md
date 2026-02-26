# 결제 시스템 구현 진행 상황

## 완료된 작업

### 1. DB 마이그레이션 — 완료
- `docs/subscription-migration.sql` Supabase에서 실행 완료
- subscriptions, usage_logs, payments 테이블 생성됨
- user_profiles에 plan 컬럼 추가됨

### 2. 서버 인프라 (api/) — 코드 작성 완료
- `api/_utils/supabaseAdmin.ts` — service_role Supabase 클라이언트
- `api/_utils/auth.ts` — JWT 인증 헬퍼
- `api/_utils/toss.ts` — 토스페이먼츠 API 헬퍼
- `vercel.json` — 크론잡(매일 09:00) + SPA rewrite

### 3. API 라우트 5개 — 코드 작성 완료
- `api/payments/billing-auth.ts` — 빌링키 발급 + 첫 결제
- `api/payments/webhook.ts` — 토스 웹훅 처리
- `api/billing/charge.ts` — 크론 월정기 결제
- `api/subscriptions/current.ts` — 구독+사용량 조회
- `api/subscriptions/cancel.ts` — 구독 해지

### 4. 클라이언트 서비스 — 코드 작성 완료
- `services/subscriptionService.ts` — 구독/사용량 클라이언트 서비스
- `services/aiGateway.ts` — withUsageTracking + UsageLimitError

### 5. UI 컴포넌트 — 코드 작성 완료
- `components/PricingModal.tsx` — 프로/교회 플랜 선택 모달
- `components/SubscriptionBanner.tsx` — 대시보드 구독 상태 배너

### 6. 기존 파일 수정 — 완료
- `package.json` — @tosspayments/tosspayments-sdk, @vercel/node 추가
- `vite.config.ts` — TOSS_CLIENT_KEY define 추가
- `App.tsx` — 구독 상태 관리, 빌링 콜백, PricingModal 렌더링
- `components/Dashboard.tsx` — SubscriptionBanner 추가
- `components/ProjectEditor.tsx` — AI 호출 9곳 withUsageTracking 래핑
- `components/BlankPage.tsx` — AI 호출 2곳 래핑
- `components/Editor/Exegesis.tsx` — AI 호출 3곳 래핑

### 7. TypeScript 검증 — 완료
- 모든 파일 에러 0건 확인

---

## 남은 작업 (토스 가입 완료 후)

### 1. Vercel 환경변수 설정
토스페이먼츠 개발자센터(developers.tosspayments.com)에서 키 발급 후:

| 변수명 | 값 | 설정 위치 |
|---|---|---|
| `TOSS_CLIENT_KEY` | `test_ck_...` (클라이언트 키) | Vercel > Settings > Environment Variables |
| `TOSS_SECRET_KEY` | `test_sk_...` (시크릿 키) | Vercel > Settings > Environment Variables |
| `TOSS_WEBHOOK_SECRET` | 토스 웹훅 시크릿 | Vercel > Settings > Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role | Vercel > Settings > Environment Variables |
| `CRON_SECRET` | 아무 랜덤 문자열 | Vercel > Settings > Environment Variables |

### 2. 패키지 설치
```bash
npm install
```

### 3. 배포
```bash
npx vercel --prod --yes
```

### 4. 테스트 체크리스트
- [ ] 무료 사용자로 AI 5회 사용 → 6회째 업그레이드 프롬프트 확인
- [ ] 프로 결제 → 토스 결제창 → 카드 등록 → 결제 성공 → 무제한 사용 확인
- [ ] 대시보드 SubscriptionBanner에 플랜/사용량 표시 확인
- [ ] 구독 해지 → current_period_end까지 서비스 유지 확인

---

## 참고: 토스 테스트 vs 라이브
- 테스트 키(`test_ck_`, `test_sk_`)로 먼저 개발/검증
- 사업자 심사 승인 후 라이브 키(`live_ck_`, `live_sk_`)로 교체
