# 8. Error Handling & Logging Strategy

<!--
## 8.1. Philosophy
...

## 8.2. AI Service Failures
...
-->

## 8.3. Storage Failures
The system uses `LocalStorage` as the sole persistence layer.

### Strategy
1.  **Quota Exceeded:**
    - **Detection:** `localStorage.setItem` throws `QuotaExceededError`.
    - **Action:** Alert user to clear space or export old projects.
    - **Prevention:** We use efficient JSON structures, but heavy usage (many drafts) may hit browser limits (usually 5MB).

<!--
[LEGACY - REMOVED]
1.  **Supabase Connection Failure:**
    - **Detection:** `storageManager.initialize()` or failed API calls.
    - **Action:** Automatically fallback to `LocalStorageAdapter`.
-->

2.  **Data Corruption:**
    - **Detection:** `JSON.parse` fails on load.
    - **Action:** Fail gracefully, return empty list, and log error to console.
    - **Recovery:** User may need to manually clear browser data if corruption is persistent.

<!--
## 8.4. User Feedback Levels
...
-->