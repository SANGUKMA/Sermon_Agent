# 4. User Flows

## 4.1. Dashboard
The central hub for managing sermon projects.

1.  **Entry (No Login):**
    - **Action:** Open application URL.
    - **System:** Immediately loads `Dashboard` with data from LocalStorage. No authentication required.

2.  **View Projects:**
    - **Default:** Shows "In Progress" projects sorted by `lastModified`.
    - **Search:** Filter by Title or Scripture passage.
    - **Tabs:** Switch between "Dashboard" (Projects) and "Series Management".

3.  **Create Project:**
    - **Action:** Click "New Project" button.
    - **System:** Loads `NewProjectModal` (Lazy Load).
    - **Input:** Title, Passage, Date, Series (Optional).
    - **Mode Selection:** "Deep Mode" (Step-by-step) or "Quick Mode" (AI Generator).

4.  **User Menu & Settings:**
    - **Action:** Click User Avatar (Local User) in Header.
    - **Dropdown:** Shows "Settings".
    - **Settings:** Opens `SettingsModal` (Lazy Load) to configure:
      - **Theological Profile:** Denomination, Style, Guardrails.
      - **Appearance:** Dynamic Theme Color (Crimson, Ocean, etc.).
      - **Plan:** Subscription status (Mock/Local).

<!--
[REMOVED]
## 4.2. Authentication Flows
- Login / Sign Up: Removed in favor of pure local usage.
-->

## 4.3. Editor Workflow
1.  **Planning:** Structure generation.
2.  **Exegesis:** Research assistance.
3.  **Meditation:** Personal journal.
4.  **Drafting:** AI writing & Versioning.
5.  **Manuscript:** Final polish & Export.