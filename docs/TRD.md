# [TRD] 기술 설계 문서 (Technical Requirements Document)

## 1. 시스템 아키텍처 (System Architecture)

### 1.1. 프론트엔드 스택
- **Framework**: React 19 (Strict Mode)
- **Language**: TypeScript (Strict Typings)
- **Styling**: Tailwind CSS (Utility-first)
- **Icons**: Lucide-React
- **Markdown**: React-Markdown (AI 응답 렌더링)

### 1.2. 데이터 저장 (Persistence)
- **Local-First Strategy**: `IndexedDB`를 사용하여 사용자의 브라우저 내에 영구 저장.
- **Adapter Pattern**: `storageManager`를 통해 향후 Cloud(Supabase 등)로의 확장이 용이한 구조.

### 1.3. AI 인터페이스 (LLM Strategy)
- **Engine**: Google Gemini API (`@google/genai`)
- **Models**:
  - `gemini-3-flash-preview`: 빠른 주석 연구 및 일반 대화용.
  - `gemini-3-pro-preview`: 복잡한 논증이 필요한 설교 초안 작성 및 신학적 검토용.
- **JSON Mode**: `responseMimeType: "application/json"`을 활용하여 정형화된 데이터 추출.

## 2. 데이터 모델 (Data Schema)

### 2.1. SermonProject
설교의 모든 상태를 담는 핵심 엔티티.
```typescript
interface SermonProject {
  id: string;
  title: string;
  passage: string;
  status: 'planning' | 'in_progress' | 'completed';
  mode: 'deep' | 'quick';
  // 단계별 데이터
  structure: string;       // Planning
  historicalContext: string; // Exegesis
  meditationEntries: MeditationEntry[]; // Meditation
  draft: string;           // Manuscript
  lastModified: number;
}
```

### 2.2. TheologicalProfile
AI의 페르소나를 결정하는 환경 설정.
```typescript
interface TheologicalProfile {
  denomination: string;
  style: string;
  avoidance: string; // 신학적으로 지양해야 할 내용
  guardrail: string; // 신학적 엄격도
}
```

## 3. AI 프롬프트 엔지니어링 전략

### 3.1. 컨텍스트 주입 (Context Injection)
모든 AI 호출 시 `getProfileInstruction()`을 통해 사용자의 신학적 배경을 시스템 인스트럭션으로 자동 삽입하여 일관성을 유지.

### 3.2. 지수 백오프 (Exponential Backoff)
`geminiService.ts` 내의 `withRetry` 헬퍼 함수를 통해 429(Rate Limit) 에러 발생 시 자동 재시도 로직 구현.

## 4. 인프라 및 보안 (Infrastructure & Security)

### 4.1. 로컬 보안
- 모든 데이터는 클라이언트 측에만 저장되며 외부 서버로 전송되지 않음(LLM API 호출 제외).
- API Key는 환경 변수(`process.env.API_KEY`)를 통해 안전하게 관리.

### 4.2. 신학적 안전장치
- `performDoctrinalReview` 에이전트가 생성된 원고를 교단 가이드라인에 비추어 비판적으로 검토하는 프로세스 설계.

## 5. 성능 최적화 (Performance)
- **Lazy Loading**: `SettingsModal`, `NewProjectModal` 등 무거운 컴포넌트는 `React.lazy`와 `Suspense`를 사용하여 초기 로딩 속도 향상.
- **Atomic State Updates**: 복잡한 프로젝트 객체 업데이트 시 불필요한 리렌더링 방지를 위해 불변성 패턴 적용.
