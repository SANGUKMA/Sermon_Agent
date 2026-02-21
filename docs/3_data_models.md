# 3. Data Models (Source of Truth)

All data structures must strictly adhere to `types.ts`.

## 3.1. Enums & Core Types
```typescript
export enum SermonStage {
  PLANNING = 'planning',
  EXEGESIS = 'exegesis',
  MEDITATION = 'meditation',
  DRAFTING = 'drafting',
  MANUSCRIPT = 'manuscript'
}

export type SermonMode = 'deep' | 'quick';
```

## 3.2. User Configuration Entities

### TheologicalProfile
Controls AI persona and theological safety.
```typescript
interface TheologicalProfile {
  denomination: string; // e.g., "Presbyterian"
  style: string;        // e.g., "Expository"
  avoidance: string;    // e.g., "Prosperity Gospel"
  guardrail?: string;   // e.g., "Moderate"
  subscription?: {
    plan: 'free' | 'pro' | 'team';
    status: 'active' | 'inactive';
    renewalDate: number;
  };
}
```

### CustomPrompt
Allows users to save reusable AI instructions.
```typescript
interface CustomPrompt {
  id: string;
  name: string;      // Display name
  content: string;   // Instruction text
}
```

## 3.3. Project Entities

### SermonProject
The aggregate root for a sermon.
```typescript
interface SermonProject {
  id: string;
  title: string;
  passage: string;
  date?: string; 
  lastModified: number;
  
  mode: SermonMode;
  status: 'planning' | 'in_progress' | 'completed' | 'archived';
  seriesId?: string;
  
  // Planning
  theme: string;
  audience: string; // Legacy string
  audienceContext?: AudienceContext; // Detailed object
  sermonGoal?: string; 
  structure: string; 
  
  // Exegesis
  historicalContext: string;
  originalLanguage: string;
  theologicalThemes: string;
  textAnalysis?: TextAnalysisItem[]; // Verse-by-verse analysis
  hermeneutics?: HermeneuticItem[];  // Observation/Interpretation/Application rows
  
  // Meditation
  journal: string; // Legacy/Summary
  meditationEntries?: MeditationEntry[]; // Timeline entries
  applicationPoints: string;
  
  // Drafting
  draft: string; // Current manuscript
  draftVersions?: DraftVersion[]; // Version history
  notes: string; // Preaching notes
  
  // Preaching
  preachingSettings?: PreachingSettings; // Timer & Speech rate settings

  version: number;
}
```

### Sub-Entities
```typescript
interface AudienceContext {
  description: string;
  averageAge?: string;
  spiritualLevel?: string;
  currentSituation?: string;
}

interface TextAnalysisItem {
  verseRef: string;
  originalText?: string;
  primaryText: string;
  secondaryText?: string;
  note: string;
}

interface HermeneuticItem {
  id: string;
  observation: string;
  interpretation: string;
  application: string;
}

interface MeditationEntry {
  id: string;
  date: number;
  prompt?: string;
  content: string;
  isPrivate: boolean;
}

interface DraftVersion {
  id: string;
  timestamp: number;
  content: string;
  options: DraftOption;
}

interface PreachingSettings {
  speechRate: 'slow' | 'normal' | 'fast';
  targetTime: number; // minutes
}
```

## 3.4. Theme System Entities
Used for dynamic color theming via CSS variables.
```typescript
interface ColorSet {
  id: string;
  name: string;
  colors: {
    primary: string;      // Maps to var(--color-primary)
    primaryHover: string; // Maps to var(--color-primary-hover)
    primaryLight: string; // Maps to var(--color-primary-light)
    primaryDark: string;  // Maps to var(--color-primary-dark)
  };
}
```

<!-- 
[NOTE]
Any changes to `types.ts` must be immediately reflected here.
-->