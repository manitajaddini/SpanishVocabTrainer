# Spanish Lemma Trainer — Full Rebuild Specification

This document is the single source of truth for recreating the current **Spanish Lemma Trainer** repository. It is intentionally explicit so that an autonomous GPT-5/Codex agent (or any developer) can rebuild the project without seeing the original source tree.

---

## 1. Product Overview

**Purpose**  
Provide a self-contained vocabulary drill application. Users upload a CSV deck, supply an OpenAI API key (or rely on the backend’s default), and receive generated prompts they must translate into the target language exactly once per cycle. The system grades answers via OpenAI’s Responses API and offers spaced-repetition insights.

**Guiding principles**

1. **Client-owned data** – CSV decks, progress, and API keys live in the user’s browser (localStorage). The backend is stateless and only forwards requests to OpenAI.
2. **Language agnostic** – Any source/target language pair should work. Language names come from CSV headers or user overrides.
3. **Resilient UX** – Onboarding, detailed error messages, retry/skip controls, and safe defaults minimize user frustration.
4. **Workspaces architecture** – Frontend and backend are separate npm workspaces in one repo, sharing scripts for dev/build.

---

## 2. System Architecture

```
Browser (React SPA) ─┬─ reads CSV → localStorage
                     ├─ POST /api/generate (with lemma + languages)
                     ├─ POST /api/evaluate (with lemma + prompt + answer + languages)
                     └─ Displays insights + handles input

Serverless Express API (Vercel) ── forwards requests to OpenAI Responses API
OpenAI Responses API ── returns generated prompt / evaluation JSON
```

There is **no database** or server-side storage. All state that persists across sessions is stored in localStorage.

---

## 3. Repository Layout

Recreate the following tree (include transpiled `.js` outputs if you need to mimic the existing repo exactly; otherwise compiling TypeScript during build is sufficient):

```
SpanishVocabTrainer/
├─ package.json              # workspaces root
├─ package-lock.json
├─ scripts/
│  ├─ dev.js                 # spawn backend + frontend dev servers
│  └─ start.js               # run backend build + Vite preview concurrently
├─ frontend/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ vite.config.ts
│  ├─ vitest.config.ts
│  ├─ vitest.setup.ts
│  └─ src/
│     ├─ App.tsx
│     ├─ main.tsx
│     ├─ index.css (global styles, contains body background + base fonts)
│     ├─ components/
│     │  ├─ CsvLoader.tsx
│     │  ├─ InsightsPanel.tsx
│     │  ├─ Onboarding.tsx
│     │  ├─ ProgressBar.tsx
│     │  ├─ QuizCard.tsx
│     │  └─ Settings.tsx
│     ├─ config/models.ts
│     ├─ lib/
│     │  ├─ csv.ts
│     │  ├─ evaluation.ts
│     │  ├─ insights.ts
│     │  ├─ openai.ts
│     │  ├─ scheduler.ts
│     │  ├─ scoring.ts
│     │  └─ storage.ts
│     ├─ types.ts
│     └─ __tests__/
│        ├─ csv.test.ts
│        ├─ evaluation.test.ts
│        ├─ openai.test.ts
│        ├─ scheduler.test.ts
│        ├─ scoring.test.ts
│        └─ storage.test.ts
└─ server/
   ├─ package.json
   ├─ tsconfig.json
   ├─ src/
      ├─ index.ts
      ├─ openai.ts
      ├─ prompts.ts
      └─ schemas.ts
```

---

## 4. Dependencies

| Package             | Version (minimum) | Notes                                        |
|---------------------|-------------------|----------------------------------------------|
| React               | ^18.2.0           | Frontend                                     |
| react-dom           | ^18.2.0           |                                              |
| TypeScript          | ^5.3.3            | Both workspaces                              |
| Vite                | ^5.0.8            | Build/dev server                             |
| Vitest              | ^1.2.1            | Frontend unit tests                          |
| `@vitejs/plugin-react` | ^4.2.1        |                                              |
| `tsx`               | ^4.7.0            | Backend dev runner                           |
| Express             | ^4.18.2           | Backend API                                  |
| `openai`            | ^4.28.4           | OpenAI Responses API client                  |
| `zod`               | ^3.22.4           | Request/response validation                   |
| `cors`              | ^2.8.5            | Enable CORS                                  |
| `clsx`              | ^2.1.0            | Lightweight conditional class merging        |
│ plus dev typings: `@types/express`, `@types/node`, `@types/react`, `@types/react-dom`, etc. |

Use npm workspaces (`package.json` at root) to manage dependencies:

```json
{
  "name": "spanish-vocab-trainer",
  "private": true,
  "workspaces": ["frontend", "server"]
}
```

Scripts defined at root:

```json
"scripts": {
  "dev": "node scripts/dev.js",
  "build": "npm --workspace server run build && npm --workspace frontend run build",
  "start": "node scripts/start.js",
  "test": "npm --workspace server run test && npm --workspace frontend run test"
}
```

---

## 5. Frontend Specification

### 5.1 Global State (App.tsx)

`App` maintains the following `useState` hooks (initial values shown):

| State variable       | Type/Initial value                       | Description                                                                      |
|----------------------|-------------------------------------------|----------------------------------------------------------------------------------|
| `csvData`            | `StoredCsv | null`                        | `{ rows: CsvRow[]; lemmas: string[]; detectedLanguages: LanguagePair }`         |
| `queue`              | `LemmaQueueState | null`                  | Holds queue, cursor, used set                                                    |
| `scoreState`         | `ScoreState` (`createInitialScoreState()`) | Global scoring metrics                                                           |
| `progress`           | `{ completedInBatch: number; totalCompleted: number }` | Batch progress + overall count                                                  |
| `currentItem`        | `QuizItem | null`                        | Current lemma + prompt + status (`pending`, `evaluating`, `feedback`)            |
| `answer`             | `string`                                  | User’s text input                                                                |
| `view`               | `'welcome' | 'quiz' | 'batch-summary'`     | Controls main rendering                                                          |
| `apiKey`             | `string`                                  | Stored API key                                                                   |
| `modelError`         | `RetryState | null`                       | Info for error toast                                                             |
| `loadingPrompt`      | `boolean`                                 | Spinner flag                                                                     |
| `batchSummary`       | `BatchSummary | null`                     | Stats for last batch of 10                                                       |
| `selectedModel`      | `'gpt-4o-mini' | 'gpt-4o'`                | Model chosen in settings                                                         |
| `showOnboarding`     | `boolean`                                 | Overlay toggle                                                                   |
| `insights`           | `InsightState` (`createInitialInsightState`) | Streaks, misses, recent results                                               |
| `languagePreference` | `{ source: string; target: string }`      | User override for languages (empty string => auto use detected)                  |
| `detectedLanguages`  | `{ source: string; target: string }`      | Derived from CSV header; defaults to `{ source: 'English', target: 'Spanish' }`  |
| `lastAttempt`        | `{ lemma: string; outcome: 'correct'|'retry'; languages: LanguagePair } | Shows banner summary for last evaluation |

**Effects** to implement:

1. On mount: load all persisted state (API key, model, languages, CSV, queue, score, progress, current item, insights, onboarding flag). Convert legacy CSV rows `{ english, spanish }` to new `{ source, target }` if encountered.
2. Persist state back to localStorage whenever `csvData`, `queue`, `scoreState`, `progress`, `currentItem`, `insights`, `languagePreference`, or `selectedModel` change.
3. When active languages change (computed signature `source.toLowerCase() + '->' + target.toLowerCase()`), clear `currentItem`, `answer`, `lastAttempt` and trigger a new prompt load.
4. When queue is present and `currentItem` is null and not loading, call `loadNextLemma(queue)`.
5. When `progress.completedInBatch >= 10`, populate `batchSummary`, switch view to `'batch-summary'`, reset batch stats via `resetBatch` and `progress.completedInBatch = 0`.

Store keys (with prefix `svt:`):

| Key name | Stored type |
|----------|-------------|
| `svt:csv-data`        | { rows, lemmas, detectedLanguages } |
| `svt:queue`           | LemmaQueueState |
| `svt:score`           | ScoreState |
| `svt:progress`        | { completedInBatch, totalCompleted } |
| `svt:current`         | { lemma, englishPrompt, attempts, answer } |
| `svt:api-key`         | string |
| `svt:model`           | string |
| `svt:onboarding`      | boolean |
| `svt:insights`        | InsightState |
| `svt:language-preference` | { source, target } |

### 5.2 CSV Loader (`components/CsvLoader.tsx`)

- Accepts props: `onLoaded(rows, lemmas, detectedLanguages)` and optional `existingCount` (number).
- Renders drop area with instructions (“Use a semicolon-separated file with two headers (target language;source language).”).
- On file selection: read text with `File.text()`, call `parseCsv`, compute `lemmas = buildLemmaSet(rows)`, then call `onLoaded`.
- Display errors (e.g., invalid header, empty deck) as red text.
- Reset file input after processing.

### 5.3 Quiz Card (`components/QuizCard.tsx`)

Props:

```ts
{
  englishPrompt: string;
  answer: string;
  status: 'pending' | 'evaluating' | 'feedback';
  attempts: number;
  onAnswerChange(value: string): void;
  onSubmit(): void;
  onRetry(): void;
  onNext(): void;
  feedback?: EvaluationResult;
  targetLemma?: string;
  disableInput?: boolean;
  sourceLanguage: string;
  targetLanguage: string;
}
```

Behavior:

- Title: “Translate to {targetLanguage || 'target language'}” and “Prompt language: {sourceLanguage || 'source language'}”.
- Textarea label: `Your answer ({targetLanguage})` if targetLanguage provided, else `Your answer`.
- Textarea disables on evaluation or when `disableInput` true.
- Submit button text toggles between “Submit” and “Checking.” and is disabled if `status === 'evaluating'`, answer empty, or `status === 'feedback'` (prevents double submits).
- Feedback section (when `status === 'feedback' && feedback`):
  - Header “Feedback” (font-semibold).
  - Body includes `grammar_feedback`, `Improved translation: {feedback.improved_translation}`, `Target lemma: {targetLemma}`, bullet list of `feedback.explanations`.
  - Buttons: Retry (outline) and Next (filled).

### 5.4 Score Panel (`components/ScorePanel.tsx`)

Props: `lemmasLeft`, `totalLemmas`, `usedCount`, `batchProgress`, `totalScore`, `batchScore`, `accuracy`, `attempts`, `avgAttempts`.

Renders summary cards with totals and a progress bar (component `ProgressBar` renders with `value` and `max=10`).

### 5.5 Insights Panel (`components/InsightsPanel.tsx`)

Props: `streak`, `bestStreak`, `recentAccuracy`, `totalTracked`, `hardLemmas` (array of `{ lemma, count }`), `issueHighlights` (string array). Shows cards for current streak/best, recent accuracy, focus list, and common issues. When insufficient data, display placeholder text (e.g., “Start a batch to unlock”, “Great coverage so far.”).

### 5.6 Settings (`components/Settings.tsx`)

Props:

```ts
{
  apiKey: string;
  model: string;
  models: readonly { value: string; label: string; helper?: string }[];
  onSave(key: string): void;
  onReset(): void;
  onModelChange(value: string): void;
  languages: LanguagePair;
  detectedLanguages: LanguagePair;
  onLanguageSave(value: LanguagePair): void;
}
```

Features:

- API key input + show/hide toggle, Save key button, note “Stored locally; used only for language model calls.”
- Model dropdown with helper text (from `MODEL_OPTIONS`).
- Language block:
  - Two inputs: target (answer language) and source (prompt language). Placeholder uses detected languages.
  - Buttons: “Save languages” (trims values and calls `onLanguageSave`) and “Use detected” (call `onLanguageSave(detectedLanguages)` and update local input state).
  - Helper text: `Leave blank to use CSV headers (Detected: <target> → <source>)`.
- Reset progress button outlines in red; calls `onReset` and clears all local storage keys.

### 5.7 Onboarding (`components/Onboarding.tsx`)

Props: `hasDeck`, `hasApiKey`, `modelLabel`, `languageLabel`, `onStart`, `onSkip`.

Implementation:

- Overlay with blur background.
- Three steps (deck, key, confirm languages/model). Each step shows number or check mark when satisfied.
- “Start practicing” button disabled until CSV + API key present.
- “Skip for now” button always enabled.

### 5.8 OpenAI Client (`lib/openai.ts`)

Exports:

- `type LanguagePair = { source: string; target: string };`
- `type RequestOptions = { apiKey?: string; model?: string; signal?: AbortSignal };`
- `class ApiError extends Error` with fields `status`, `detail?`, `code?`, `body?`.
- `generatePrompt(params: { lemma: string; languages: LanguagePair }, options?: RequestOptions): Promise<string>`:
  - Uses `fetch(BASE_URL + '/generate')` with method POST, JSON body, headers `Content-Type`, optional `x-api-key`, optional `x-model`.
  - Retries up to 3 times with exponential backoff (300ms, 600ms, 1200ms).
  - Throws ApiError on non-OK; expects response `{ prompt: string }`.
- `evaluateAnswer(params: { lemma: string; prompt: string; userAnswer: string; languages: LanguagePair }, options?: RequestOptions): Promise<EvaluationResult>`:
  - POST `/evaluate` with similar headers/retry logic. Expects `{ result: EvaluationResult }`.

### 5.9 CSV & Scheduler Modules

- `CsvRow` defined in `types.ts` as `{ target: string; source: string; }`.
- `LanguagePair` same as backend.
- `StoredCsv` extends rows + lemmas + detected languages.
- Scheduler logic ensures each lemma appears once per cycle, supports repeat skip which rotates lemma to end of queue.

### 5.10 Evaluation Helpers (`lib/evaluation.ts`)

`shouldAdvance(result)` returns true if `result.is_correct_meaning && result.uses_target_lemma_or_inflection` else false.

### 5.11 Styles

- Body background dark (#0F172A analog). All components use Tailwind-like classes (prefixed with `bg-slate-…`, `text-slate-…`, etc.). Maintain the same classes as existing code for consistent design.

---

## 6. Backend Specification

### 6.1 Express Setup (`server/src/index.ts`)

```ts
import express from 'express';
import cors from 'cors';
import { handleGenerate, handleEvaluate } from './openai.js';
import { generateRequestSchema, evaluateRequestSchema } from './schemas.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch {
    res.status(400).json({ error: 'Invalid request payload' });
  }
};

app.post('/api/generate', validate(generateRequestSchema), handleGenerate);
app.post('/api/evaluate', validate(evaluateRequestSchema), handleEvaluate);

const port = process.env.PORT ?? 3001;
if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
```

### 6.2 Validation (`server/src/schemas.ts`)

See section 5.2 — same structure.

### 6.3 Prompts (`server/src/prompts.ts`)

Functions:

- `sanitize(value, fallback)` – trims string, falls back when empty.
- `buildGenerationSystemPrompt(languages)` – returns string:
  > "You create concise {source} sentences whose most natural {target} translation must include a specific {target} lemma (or a correct inflection). Never reveal that lemma. Avoid named entities, slang, and ambiguous idioms. Keep 5-14 words with CEFR A2-B2 difficulty. Maintain a neutral tone."
- `buildGenerationUserPayload(lemma, languages)` – returns object with `target_language`, `source_language`, `target_lemma`, `constraints` (word count min/max, CEFR, avoid list).
- `buildEvaluationSystemPrompt(languages)` – instructs evaluator to judge {target} answer vs {source} prompt, set uses_target_lemma flag, output JSON matching schema, respond in target language with concise feedback.
- `buildEvaluationUserPayload(prompt, lemma, userAnswer, languages)` – returns JSON with `source_language`, `target_language`, `source_prompt`, `target_lemma`, `user_answer`, `rules` (grading cases: full_credit, partial, incorrect, plus `feedback_style`).
- `evaluationResponseFormat` – JSON schema for OpenAI structured output:
  ```json
  {
    "type": "json_schema",
    "name": "evaluation_result",
    "strict": true,
    "schema": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "is_correct_meaning": { "type": "boolean" },
        "uses_target_lemma_or_inflection": { "type": "boolean" },
        "grammar_feedback": { "type": "string" },
        "improved_translation": { "type": "string" },
        "explanations": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1,
          "maxItems": 3
        },
        "score_delta": { "type": "integer", "enum": [-1, 0, 1] }
      },
      "required": ["is_correct_meaning","uses_target_lemma_or_inflection","grammar_feedback","improved_translation","explanations","score_delta"]
    }
  }
  ```

### 6.4 OpenAI Handlers (`server/src/openai.ts`)

Key pieces:

- `const MODEL_GENERATION = 'gpt-4o-mini';`
- `const MODEL_EVALUATION = 'gpt-4o-mini';`
- `const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o']);`
- `getApiKey(req)` returns header `x-api-key` if non-empty string else `process.env.OPENAI_API_KEY`; if missing => throw with `{ status: 401 }`.
- `resolveModel(req, fallback)` checks header `x-model`, trims, returns only allowed values.
- `shouldRetry(error)` returns false for 4xx, true otherwise.
- `withRetry(fn, attempts=3)` loops with exponential backoff (300 ms * 2^i).
- `normalizeError(error, fallback)` handles `OpenAI.APIError`, returns `{ status, body: { error: fallback, detail, code } }`, else generic detail.
- `handleGenerate`:
  - Parses body (already validated).
  - Creates `client = new OpenAI({ apiKey })`.
  - Calls `responses.create` with `input` array: `[ { role: 'system', content: buildGenerationSystemPrompt(languages) }, { role: 'user', content: JSON.stringify(buildGenerationUserPayload(lemma, languages)) } ]`.
  - Extracts `response.output_text` or navigation fallback.
  - Responds `res.json({ prompt: result })`.
  - On error, log and respond `res.status(status).json({ ...body, model, languages })`.
- `handleEvaluate` parallels the above but includes `text.format = evaluationResponseFormat`. Parse output JSON, validate with `evaluationResponseSchema`, return `res.json({ result })`.

---

## 7. API Contract

### 7.1 Generate Prompt

- **Request**
  - Method: `POST`
  - URL: `/api/generate`
  - Headers:
    - `Content-Type: application/json`
    - Optional `x-api-key: <OpenAI key>` (overrides server key)
    - Optional `x-model: gpt-4o` (must be in allowlist)
  - Body:
    ```json
    {
      "lemma": "hablar",
      "languages": {
        "source": "English",
        "target": "Spanish"
      }
    }
    ```
- **Responses**
  - `200 OK` `{"prompt": "They speak clearly in public."}`
  - `400 Bad Request` `{"error": "Invalid request payload"}` when body missing/invalid.
  - `401 Unauthorized` `{"error":"Failed to generate prompt","detail":"Missing OpenAI API key","model":"gpt-4o-mini","languages":{"source":"English","target":"Spanish"}}` if API key absent.
  - Other errors: same JSON with `detail` and `code` when available.

### 7.2 Evaluate Answer

- **Request**
  - Method: `POST`
  - URL: `/api/evaluate`
  - Body example:
    ```json
    {
      "lemma": "hablar",
      "prompt": "They speak clearly in public.",
      "userAnswer": "Hablan claramente en público.",
      "languages": { "source": "English", "target": "Spanish" }
    }
    ```
- **Successful response**
  ```json
  {
    "result": {
      "is_correct_meaning": true,
      "uses_target_lemma_or_inflection": true,
      "grammar_feedback": "Excelente. Usaste el verbo con fluidez.",
      "improved_translation": "Hablan claramente en público.",
      "explanations": ["El verbo 'hablar' está conjugado correctamente."],
      "score_delta": 1
    }
  }
  ```
- Errors follow same schema as generate (with `detail`, `code`, `model`, `languages`).

---

## 8. UI & Interaction Flows

### 8.1 First-time onboarding

1. App loads with `view = 'welcome'`, `showOnboarding = true`.
2. User uploads CSV (`CsvLoader` set `onLoaded`) — the view switches to `quiz`, queue created, languages detected.
3. User saves API key via Settings (stores in localStorage). Sch steps show check marks.
4. Once both steps satisfied, “Start practicing” becomes active. On click, overlay dismisses, `showOnboarding = false`, persisted flag set to true.

### 8.2 Prompt cycle

1. If queue available and not loading, `loadNextLemma` fetches prompt. `loadingPrompt=true` until response.
2. On success, `currentItem` set, `answer=''`, `lastAttempt=null`, `loadingPrompt=false`. “Loading next item…” panel disappears.
3. User types answer, clicks Submit:
   - Button disabled to prevent duplicates; status `evaluating` shows `Checking.` label.
   - `evaluateAnswer` returns. If success:
     - Update scoring + insights + lastAttempt banner (with lemma and languages). Banner sits between ScorePanel and InsightsPanel.
     - If `shouldAdvance` true → mark lemma used, increment progress, clear currentItem. Else show feedback with Retry/Next buttons and re-enable input (but Submit stays disabled while in feedback).
   - If API error → show toast with details, allow Retry or Skip.
4. Retry sets status back to `pending`, keeps answer, increments attempts accordingly.
5. Next (from feedback) marks lemma used, updates progress, clears current item.
6. Skip (toast action) uses `skipCurrentLemma` to rotate lemma to end, clears current item and answer.

### 8.3 Batch summary

- After 10 completed items, `progress.completedInBatch` hits 10 → show `batchSummary` view with score, accuracy, attempts, top issues (from explanations). Button “Keep going” resets view to quiz, resets batch stats.

### 8.4 Reset operation

- Settings “Reset progress” clears all local storage keys above, resets state to initial values, sets `showOnboarding=true`, languages back to default, lastAttempt cleared.

### 8.5 Error handling

- When `modelError` set, toast appears at bottom with message, detail, status, code, model, languages. Buttons: Retry (re-run `loadNextLemma` or `handleSubmit` depending on `action`) and Skip (call `handleSkip`). Toast disappears once error resolved or skip triggered.

---

## 9. Build, Test, Deploy

### 9.1 Installation

```bash
npm install
```

### 9.2 Development

```bash
npm run dev
```

This runs `scripts/dev.js`, which spawns:

- Backend: `npm --workspace server run dev` (tsx watch).
- Frontend: `npm --workspace frontend run dev` (Vite dev server, default port 5173). Vite proxy forwards `/api` → `http://localhost:3001`.

### 9.3 Production Build

```bash
npm run build
```

Compile backend (`tsc -b`) to `server/dist`, frontend (`vite build`) to `frontend/dist`. `scripts/start.js` runs both for local production preview (`node dist/index.js` + `vite preview`).

### 9.4 Tests

```bash
npm --workspace frontend run test
```

Vitest runs in Node + jsdom environment (configured via `vitest.config.ts` and `vitest.setup.ts`).

Currently there are no backend tests; `npm --workspace server run test` simply executes `vitest run` (can be left with placeholder or removed).

### 9.5 Deployment (Vercel)

*Frontend Project*

- Root: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_BASE_URL=https://<backend-project>.vercel.app/api`

*Backend Project*

- Root: `server`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `OPENAI_API_KEY=<secret>`
- Requests to `/` or `/favicon.*` return 404 (expected).

---

## 10. Validation Checklist

Use this to confirm a rebuilt repo matches the original behavior:

- [ ] CSV upload accepts double-quoted values and auto-detects languages; invalid formats show toast.
- [ ] Onboarding overlay shows three steps; Start practicing unlocks once CSV + API key present.
- [ ] Generated prompts display within 2s and include natural sentences; arrow indicator (“Loading next item…”) disappears when prompt ready.
- [ ] Submit button disabled while evaluating and while feedback is visible.
- [ ] Feedback always lists target lemma regardless of correctness.
- [ ] Retry re-evaluates without changing queue; Next marks lemma as used.
- [ ] Skip rotates lemma to end of queue; new prompt loads.
- [ ] Batch summary triggers after 10 items; pressing “Keep going” resumes queue with batch stats reset.
- [ ] Insights panel updates streaks, recent accuracy, focus lemmas after each evaluation.
- [ ] Toast displays error details (status, code, model, languages); Retry/Skip behave as expected.
- [ ] Reset clears all progress and reopens onboarding.
- [ ] `npm --workspace server run build`, `npm --workspace frontend run build`, and `npm --workspace frontend run test` all succeed.
- [ ] Deployed backend handles `/api/generate` and `/api/evaluate` returning 200; failing responses bubble detail to client.

---

## 11. Future Enhancements (Non-binding)

The current spec stops at single-user, device-local usage. Potential expansions (documented for context but **not** part of this rebuild):

- User authentication, multi-device sync, deck sharing.
- Audio prompts or speech input.
- Additional analytics or spaced repetition algorithms.
- Backend tests and rate limiting.

---

## 12. Glossary

- **Lemma** – unique vocabulary entry from CSV target column.
- **Languages** – `source` (prompt language) and `target` (user answer language). Derived from CSV headers by default.
- **Batch** – group of 10 completed prompts, after which a summary is shown.
- **Insight banner** – small card showing result of the last attempt (correct vs retry, lemma, languages).
- **Model** – OpenAI model identifier, default `gpt-4o-mini` with optional `gpt-4o`.

---

This specification is exhaustive; following it step-by-step will yield a project indistinguishable from the original Spanish Lemma Trainer repository.
