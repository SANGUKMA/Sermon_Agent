
export type SermonStage = 'PLANNING' | 'EXEGESIS' | 'MEDITATION' | 'DRAFTING' | 'MANUSCRIPT';

export const SermonStage = {
  PLANNING: 'PLANNING' as SermonStage,
  EXEGESIS: 'EXEGESIS' as SermonStage,
  MEDITATION: 'MEDITATION' as SermonStage,
  DRAFTING: 'DRAFTING' as SermonStage,
  MANUSCRIPT: 'MANUSCRIPT' as SermonStage,
};

export type SermonMode = 'deep' | 'quick' | 'manual';

export interface AudienceContext {
  description: string;
  averageAge?: string;
  spiritualLevel?: string;
  currentSituation?: string;
}

export interface TextAnalysisItem {
  verseRef: string;
  primaryText: string;
  note: string;
}

export interface HermeneuticItem {
  id: string;
  observation: string;
  interpretation: string;
  application: string;
}

export interface MeditationEntry {
  id: string;
  date: number;
  prompt: string;
  content: string;
  isPrivate: boolean;
}

export interface DraftVersion {
  id: string;
  timestamp: number;
  content: string;
  options: DraftOption;
}

export interface PreachingSettings {
  speechRate: 'slow' | 'normal' | 'fast';
  targetTime: number;
}

export interface EditorSettings {
  backgroundColor: string;
  fontSize: number;
  lineHeight: number;
}

export interface SermonProject {
  id: string;
  title: string;
  passage: string;
  theme: string;
  audience: string;
  audienceContext: AudienceContext;
  sermonGoal: string;
  structure: string;
  historicalContext: string;
  originalLanguage: string;
  theologicalThemes: string;
  textAnalysis: TextAnalysisItem[];
  hermeneutics: HermeneuticItem[];
  journal: string;
  meditationEntries: MeditationEntry[];
  applicationPoints: string;
  draft: string;
  draftVersions: DraftVersion[];
  notes: string;
  preachingSettings: PreachingSettings;
  editorSettings: EditorSettings;
  version: number;
  mode: SermonMode;
  status: string;
  lastModified: number;
  date?: string;
  seriesId?: string;
  isDeleted?: boolean;
  deletedAt?: number;
  isLocked?: boolean;
}

export interface SermonSeries {
  id: string;
  title: string;
  description: string;
  lastModified: number;
}

export interface TheologicalProfile {
  denomination: string;
  style: string;
  avoidance: string;
  guardrail?: string;
  preferredStructure?: string;
  defaultAudience?: AudienceContext;
}

export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
}

export interface DraftOption {
  length: 'short' | 'medium' | 'long';
  tone: 'warm' | 'authoritative' | 'storytelling' | 'academic';
  audienceFocus: string;
}

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
}

export interface ColorSet {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const DEFAULT_PROFILE: TheologicalProfile = {
  denomination: '대한예수교장로회 (합동)',
  style: '전통적 삼대지 강해 설교',
  avoidance: '지나치게 자극적인 예화, 세속적 성공주의',
  guardrail: '성경 중심의 복음주의',
  preferredStructure: '서론 - 본론 1, 2, 3 - 결론 및 기도',
  defaultAudience: {
    description: '주일 예배를 위해 모인 성도들',
    averageAge: '30-60대',
    spiritualLevel: '말씀 안에서 영적 성장을 추구하는 예배자',
    currentSituation: '주일에 하나님의 말씀을 사모하며 예배드리러 나아온 상태'
  }
};

export const AVAILABLE_COLOR_SETS: ColorSet[] = [
  {
    id: 'crimson',
    name: 'Crimson',
    colors: {
      primary: '#9f1239',
      primaryHover: '#881337',
      primaryLight: '#fff1f2',
      primaryDark: '#4c0519'
    }
  },
  {
    id: 'navy',
    name: 'Navy',
    colors: {
      primary: '#1e3a5f',
      primaryHover: '#152d4a',
      primaryLight: '#eff6ff',
      primaryDark: '#0c1a2e'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#166534',
      primaryHover: '#14532d',
      primaryLight: '#f0fdf4',
      primaryDark: '#052e16'
    }
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    colors: {
      primary: '#6d28d9',
      primaryHover: '#5b21b6',
      primaryLight: '#f5f3ff',
      primaryDark: '#3b0764'
    }
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    colors: {
      primary: '#b45309',
      primaryHover: '#92400e',
      primaryLight: '#fffbeb',
      primaryDark: '#451a03'
    }
  },
  {
    id: 'slate',
    name: 'Classic Slate',
    colors: {
      primary: '#334155',
      primaryHover: '#1e293b',
      primaryLight: '#f8fafc',
      primaryDark: '#0f172a'
    }
  }
];

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  backgroundColor: '#ffffff',
  fontSize: 18,
  lineHeight: 1.8
};

export const SAMPLE_PROJECT: SermonProject = {
  id: 'sample-1',
  title: '고난 중에 만나는 하나님의 위로',
  passage: '고린도후서 1:3-7',
  theme: '영적 회복',
  audience: '주일예배 성도',
  audienceContext: { 
    description: '주일 예배를 위해 모인 성도들',
    currentSituation: '말씀을 통해 영적 성장과 회복을 사모하는 시점' 
  },
  sermonGoal: '말씀을 통해 하나님의 위로와 소망을 새롭게 붙잡기',
  structure: 'I. 서론: 하나님의 위로 앞에 나아옴\nII. 본론 1: 모든 위로의 하나님 (3-4절)\nIII. 본론 2: 고난이 넘칠 때 흐르는 위로 (5절)\nIV. 본론 3: 위로를 나누는 공동체 (6-7절)\nV. 결론: 말씀으로 세워지는 삶',
  historicalContext: '',
  originalLanguage: '',
  theologicalThemes: '',
  textAnalysis: [],
  hermeneutics: [],
  journal: '',
  meditationEntries: [],
  applicationPoints: '',
  draft: '',
  draftVersions: [],
  notes: '',
  preachingSettings: { speechRate: 'normal', targetTime: 20 },
  editorSettings: DEFAULT_EDITOR_SETTINGS,
  version: 1,
  mode: 'deep',
  status: 'planning',
  lastModified: Date.now(),
  isDeleted: false,
  isLocked: false
};

export const DEFAULT_PROJECT: Omit<SermonProject, 'id' | 'lastModified'> = {
  title: '주일예배 설교: 회복과 소망',
  passage: '',
  theme: '영적 성장',
  audience: '주일예배 성도',
  audienceContext: {
    description: '주일 예배를 위해 모인 성도들',
    averageAge: '30-60대',
    spiritualLevel: '말씀 안에서 영적 성장을 추구하는 예배자',
    currentSituation: '주일에 하나님의 말씀을 사모하며 예배드리러 나아온 상태'
  },
  sermonGoal: '말씀을 통해 하나님을 깊이 알고 삶에서 그 믿음을 실천하는 힘을 얻기',
  structure: '',
  historicalContext: '',
  originalLanguage: '',
  theologicalThemes: '',
  textAnalysis: [],
  hermeneutics: [],
  journal: '',
  meditationEntries: [],
  applicationPoints: '',
  draft: '',
  draftVersions: [],
  notes: '',
  preachingSettings: {
    speechRate: 'normal',
    targetTime: 20
  },
  editorSettings: DEFAULT_EDITOR_SETTINGS,
  version: 1,
  mode: 'deep',
  status: 'planning',
  isDeleted: false,
  isLocked: false
};
