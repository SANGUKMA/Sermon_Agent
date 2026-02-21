# 5. Feature Specs: AI Logic

## 5.1. General AI Principles
- **Service:** `services/geminiService.ts`
- **Models:** `gemini-2.5-flash` (Fast), `gemini-3-pro-preview` (Deep).

## 5.2. Theological Profile Injection
*Function:* `getProfileInstruction(profile)`
- **Logic:** Appends user's denomination, style, and avoidance lists to every prompt.
- **Guardrail:** If `profile.guardrail` is set, explicit instructions are added to maintain that tone (e.g., "Maintain a Conservative tone").

## 5.3. Quick Sermon Mode
*Function:* `generateQuickSermonContent`
- **Goal:** Create a full sermon packet in one go.
- **Input:** Title, Passage, Theme, Audience.
- **Output:** JSON object containing Structure, Context, Themes, Journal, Application, and Full Draft.
- **Model:** Uses `gemini-3-pro-preview` with `responseSchema` for valid JSON.

## 5.4. Exegesis Assistance
*Function:* `generateExegesisHelp`
- **Modes:** 
  1.  **Creation:** Generates initial research for History/Language/Theology.
  2.  **Refinement:** If content exists, acts as a "Research Assistant" to merge new insights without deleting existing user notes.

## 5.5. Drafting & Versioning
*Function:* `generateSermonDraft`
- **Input:** All previous stages (Structure, Exegesis, Journal).
- **Settings:** Tone (Warm, Academic, etc.), Length (Short, Medium, Long).
- **Constraint:** Recognizes `[[LOCAL_STORY]]` placeholders to avoid inventing fake personal anecdotes.

## 5.6. Manuscript Polishing
*Function:* `polishBlock(text, instruction, profile, explain)`
- **Explain Mode:** If enabled, AI appends a `[[AI EXPLANATION: ...]]` block detailing why changes were made.

## 5.7. Doctrinal Review
*Function:* `performDoctrinalReview`
- **Persona:** "Strict Theologian Review Board".
- **Output:** Markdown report highlighting potential heresies or profile mismatches.

## 5.8. Reverse Engineering (Import)
*Function:* `analyzeImportedSermon`
- **Goal:** Convert raw text import into a structured project.
- **Logic:** Extracts Title, Passage, Structure, and Draft from unstructured text.

<!--
[PLANNED AI FEATURES]
- Audio Analysis: Transcription of recorded sermon practice.
- Image Generation: Slide background generation based on sermon theme.
-->