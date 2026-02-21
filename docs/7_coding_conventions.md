
# 7. Coding Conventions

<!--
## 7.1. General Rules
- **Language:** TypeScript (Strict Mode).
- **Style:** Functional Components with Hooks.
- **Styling:** Tailwind CSS (Utility-first).
-->

## 7.2. File Organization
- **Grouping by Domain:**
  - Do not dump all components in the root `components/` folder.
  - If a component (e.g., `Dashboard`) has sub-components used *only* by it, create a sub-directory (e.g., `components/dashboard/`).
- **Filenames:** PascalCase for Components (`ProjectCard.tsx`), camelCase for utilities (`geminiService.ts`).
- **Barrel Files:** Do not use `index.ts` files for exports unless necessary for library packaging.

<!--
## 7.3. Naming Conventions
...

## 7.4. State Management
...

## 7.5. AI Integration
...
-->

## 7.6. Performance Patterns
- **Code Splitting:**
  - Use `React.lazy` for Modals, Drawers, and heavy logic blocks.
  - Ensure a `<Suspense>` boundary exists to handle the loading state.
- **Import Hygiene:**
  - Remove unused imports immediately.
  - Avoid circular dependencies between `types.ts` and components.
