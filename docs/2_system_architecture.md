# 2. System Architecture

## 2.1. Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
- **AI:** Google Gemini API (Multimodal).
<!-- - **Backend:** Supabase (Auth & Database) [REMOVED] -->

## 2.2. Directory Structure
The codebase follows a domain-driven grouping for complex components.

```
/src
  /assets            # Static assets
  /components
    /dashboard       # Dashboard sub-components
      NewProjectModal.tsx
      ProjectCard.tsx
      SettingsModal.tsx
    /Editor          # Sermon Editor sub-components
      Drafting.tsx
      Exegesis.tsx
      ...
    Dashboard.tsx    # Main Orchestrator
    ProjectEditor.tsx
    ...
  /services
    geminiService.ts # AI Logic
    storage.ts       # Storage Adapter Pattern (Local Only)
    /* supabaseClient.ts [REMOVED] */
  /docs              # Architecture & Specifications
  App.tsx            # Root Component & Routing
  types.ts           # Global Type Definitions
```

## 2.3. Data Storage Strategy
We employ a **Local-First Storage Pattern** via the `StorageAdapter` interface.

- **Primary (Local):** `LocalStorage`.
  - All data (Projects, Series, Profiles) is serialized to JSON and stored in the browser's `localStorage`.
  - Key prefix: `ps_*` (e.g., `ps_projects`).
  - **Note:** Data is specific to the user's device/browser and is not synchronized across devices.

<!--
[LEGACY]
- **Primary (Cloud):** Supabase (PostgreSQL).
  - Uses `JSONB` columns for complex nested objects (SermonProject).
  - Uses `RLS` (Row Level Security) for data isolation.
-->

## 2.7. Frontend Component Architecture
To optimize performance and maintainability:

1.  **Modular Decomposition:**
    - Large pages like `Dashboard` are broken down. Sub-features (Modals, Cards) reside in `components/dashboard/`.
2.  **Lazy Loading (Code Splitting):**
    - Heavy components that are not immediately visible (e.g., `SettingsModal`, `NewProjectModal`) are imported using `React.lazy`.
    - Wrapped in `<Suspense>` to prevent blocking the main thread during initial load.