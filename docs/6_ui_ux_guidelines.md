
<!-- 
# 6. UI/UX Guidelines
...
## 6.9. Authentication Screens
...
-->

## 6.11. Performance UX
- **Lazy Loading Feedback:**
  - When opening heavy features (like Settings), show an immediate skeletal state or spinner/backdrop to indicate loading is occurring.
  - Do not block the main thread; ensure the UI remains responsive during dynamic imports.
- **Critical Rendering Path:**
  - The Project List (`ProjectCard`) must render immediately.
  - Secondary actions (New Project, Settings) can be deferred.
