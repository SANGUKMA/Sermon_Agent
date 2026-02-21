
<!--
# 9. Testing Strategy
...
## 9.3. Mocking Strategy
...
-->

## 9.4. Testing Lazy Loaded Components
- **Integration Tests:**
  - When testing `Dashboard`, ensure that `Suspense` fallbacks are handled or awaited.
  - Use `await findBy...` instead of `getBy...` when interacting with elements inside lazy-loaded modals (e.g., clicking "Settings" button).
- **Unit Tests:**
  - `SettingsModal` and `NewProjectModal` should be tested in isolation to verify form logic without needing the full Dashboard context.
