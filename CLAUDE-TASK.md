# Task: Add inline form validation to link modal
ID: 366daebc | Branch: feat/add-inline-form-validation-to-link-modal | Type: feat

## Restart Context
**Reason**: Reviewer requested changes
**Last milestone**: committed (2026-03-17T20:31:05.939Z)
Resume from this point — do not redo completed phases.
**Branch**: feat/add-inline-form-validation-to-link-modal

### Last Checkpoint
[verification-baseline] typecheck: pass (sha256:dd18ad77da07) | test: fail (sha256:0ff6b0ec3a4e)

### Recent Progress
- [16:31] Addressed all reviewer findings and pushed fixes. Hook now exposes reset() function, extracts validateField() helper to eliminate duplication, and computes isValid from current values instead of stale state. LinkModal calls reset() when closing to prevent stale errors on re-open.

### Git State
Last commit: "fix(www): address reviewer feedback on form validation"
Uncommitted changes: 2 files

### PR
https://github.com/jgretz/schwankie/pull/30

### ⚠ Reviewer Findings — YOU MUST ADDRESS THESE
The automated reviewer blocked your PR. Read each finding below and fix it.
Do NOT re-implement from scratch.
[SCOPE DRIFT] findings: run `git checkout origin/main -- <file>` to revert. Do NOT justify or make further edits.
After fixing, commit and push. The reviewer will re-review automatically.

- **[T2]** validateField uses `value: any` parameter type. Commit 3874785 message claims 'Replace any types with proper generics in useFormValidation hook' but this specific instance was not fixed. Violates code style (no any) and misrepresents the commit.

  **Suggested fix** (`apps/www/src/components/modal/use-form-validation.ts`):
  ```
  - (fieldName: string, value: any): string | undefined => {
  + (fieldName: keyof T & string, value: T[keyof T]): string | undefined => {
  ```

- **[T1]** URL format regex /^https?:\/\/.+/ is duplicated: once in formValidationSchema (link-modal.tsx) and once inline in UrlEntryStage. Extract to a shared constant or validator to satisfy DRY.

### Fix Verification Protocol
For EACH finding above:
1. `grep` the file for the problematic pattern to confirm it exists
2. Read the relevant section (use `Bash(cat -n file | sed -n Xp,Yp)` if the Read tool is blocked)
3. Edit the file with the exact `old_string` from what you just read
4. After editing, `grep` again to confirm the pattern is GONE
5. If the pattern persists, your edit did not apply — re-read and retry with the exact string

Do NOT commit until all T4/T3 patterns are confirmed removed via grep.

### Current PR Diff (your code vs main)
This is the exact current state of your changes. Use it to identify the code you need to fix:
```diff
diff --git a/apps/www/src/components/modal/link-modal.tsx b/apps/www/src/components/modal/link-modal.tsx
index 68030a9..13e39c4 100644
--- a/apps/www/src/components/modal/link-modal.tsx
+++ b/apps/www/src/components/modal/link-modal.tsx
@@ -18,6 +18,7 @@ import {
 import {useLinkModal} from './link-modal-context';
 import {StatusToggle} from './status-toggle';
 import {TagChipInput} from './tag-chip-input';
+import {useFormValidation} from './use-form-validation';
 
 type Stage = 'url-entry' | 'loading' | 'form';
 
@@ -39,6 +40,54 @@ const emptyForm: FormData = {
   tags: [],
 };
 
+const formValidationSchema = {
+  url: {
+    required: true,
+    rules: [
+      {
+        validate: (v: string) => /^https?:\/\/.+/.test(v),
+        message: 'Must be a valid URL (http:// or https://)',
+      },
+      {
+        validate: (v: string) => v.length <= 2000,
+        message: 'Must be under 2000 characters',
+      },
+    ],
+  },
+  title: {
+    required: true,
+    rules: [
+      {
+        validate: (v: string) => v.length <= 200,
+        message: 'Must be under 200 characters',
+      },
+    ],
+  },
+  description: {
+    rules: [
+      {
+        validate: (v: string) => v.length <= 1000,
+        message: 'Must be under 1000 characters',
+      },
+    ],
+  },
+  imageUrl: {
+    rules: [
+      {
+        validate: (v: string) => {
+          if (!v) return true;
+          return /^https?:\/\/.+/.test(v);
+        },
+        message: 'Must be a valid URL (http:// or https://)',
+      },
+      {
+        validate: (v: string) => v.length <= 2000,
+        message: 'Must be under 2000 characters',
+      },
+    ],
+  },
+};
+
 export function LinkModal() {
   const {isOpen, mode, editLink, close} = useLinkModal();
   const queryClient = useQueryClient();
@@ -48,6 +97,7 @@ export function LinkModal() {
   const [saving, setSaving] = useState(false);
   const [confirmDelete, setConfirmDelete] = useState(false);
   const [error, setError] = useState('');
+  const {errors, validate, touch, touched, reset} = useFormValidation(formValidationSchema, form);
 
   // Reset state when modal opens/closes
   useEffect(() => {
@@ -57,6 +107,7 @@ export function LinkModal() {
       setSaving(false);
       setConfirmDelete(false);
       setError('');
+      reset();
       return;
     }
 
@@ -97,6 +148,10 @@ export function LinkModal() {
   }, []);
 
   const handleSave = useCallback(async () => {
+    if (!validate()) {
+      return;
+    }
+
     setSaving(true);
     setError('');
     try {
@@ -134,7 +189,7 @@ export function LinkModal() {
     } finally {
       setSaving(false);
     }
-  }, [mode, editLink, form, queryClient, close]);
+  }, [mode, editLink, form, queryClient, close, validate]);
 
   const handleDelete = useCallback(async () => {
     if (!editLink) return;
@@ -185,38 +240,42 @@ export function LinkModal() {
 
         {stage === 'form' && (
           <div className="space-y-4">
-            <Field label="URL">
+            <Field label="URL" required error={touched.url ? errors.url : undefined}>
               <input
                 type="url"
                 value={form.url}
                 onChange={(e) => updateField('url', e.target.value)}
+                onBlur={() => touch('url')}
                 className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
               />
             </Field>
 
-            <Field label="Title">
+            <Field label="Title" required error={touched.title ? errors.title : undefined}>
               <input
                 type="text"
                 value={form.title}
                 onChange={(e) => updateField('title', e.target.value)}
+                onBlur={() => touch('title')}
                 className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
               />
             </Field>
 
-            <Field label="Description">
+            <Field label="Description" error={touched.description ? errors.description : undefined}>
               <textarea
                 value={form.description}
                 onChange={(e) => updateField('description', e.target.value)}
+                onBlur={() => touch('description')}
                 rows={2}
                 className="w-full resize-none rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
               />
             </Field>
 
-            <Field label="Image URL">
+            <Field label="Image URL" error={touched.imageUrl ? errors.imageUrl : undefined}>
               <input
                 type="url"
                 value={form.imageUrl}
                 onChange={(e) => updateField('imageUrl', e.target.value)}
+                onBlur={() => touch('imageUrl')}
                 className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors focus:border-accent"
               />
             </Field>
@@ -252,7 +311,7 @@ export function LinkModal() {
               <button
                 type="button"
                 onClick={handleSave}
-                disabled={saving || !form.title.trim() || !form.url.trim()}
+                disabled={saving}
                 className="rounded-md bg-accent px-4 py-1.5 font-sans text-[0.8rem] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
               >
                 {saving ? 'Saving…' : mode === 'edit' ? 'Update' : 'Save'}
@@ -267,20 +326,42 @@ export function LinkModal() {
 
 function UrlEntryStage({onSubmit}: {onSubmit: (url: string) => void}) {
   const [url, setUrl] = useState('');
+  const [error, setError] = useState('');
 
   function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     const trimmed = url.trim();
-    if (trimmed) onSubmit(trimmed);
+
+    if (!trimmed) {
+      setError('Required');
+      return;
+    }
+
+    if (!/^https?:\/\/.+/.test(trimmed)) {
+      setError('Must be a valid URL (http:// or https://)');
+      return;
+    }
+
+    setError('');
+    onSubmit(trimmed);
   }
 
   return (
     <form onSubmit={handleSubmit} className="space-y-4">
-      <Field label="URL">
+      <Field label="URL" required error={error || undefined}>
         <input
           type="url"
           value={url}
-          onChange={(e) => setUrl(e.target.value)}
+          onChange={(e) => {
+            setUrl(e.target.value);
+            setError('');
+          }}
+          onBlur={() => {
+            const trimmed = url.trim();
+            if (trimmed && !/^https?:\/\/.+/.test(trimmed)) {
+              setError('Must be a valid URL (http:// or https://)');
+            }
+          }}
           placeholder="https://…"
           autoFocus
           className="w-full rounded-md border border-border bg-bg px-3 py-2 font-sans text-[0.85rem] text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent"
@@ -299,11 +380,25 @@ function UrlEntryStage({onSubmit}: {onSubmit: (url: string) => void}) {
   );
 }
 
-function Field({label, children}: {label: string; children: React.ReactNode}) {
+function Field({
+  label,
+  children,
+  error,
+  required,
+}: {
+  label: string;
+  children: React.ReactNode;
+  error?: string;
+  required?: boolean;
+}) {
   return (
     <label className="block space-y-1">
-      <span className="font-sans text-[0.8rem] font-medium text-text-muted">{label}</span>
+      <span className="font-sans text-[0.8rem] font-medium text-text-muted">
+        {label}
+        {required && <span className="text-accent"> *</span>}
+      </span>
       {children}
+      {error && <p className="font-sans text-[0.75rem] text-destructive">{error}</p>}
     </label>
   );
 }
diff --git a/apps/www/src/component
... (diff truncated)
```

## Plan
## Context

The link modal (`apps/www/src/components/modal/link-modal.tsx`) currently validates by disabling the Save button when `!url.trim() || !title.trim()` (line 249). There are no inline error messages, no URL format validation on the client, no character limits, and no required-field indicators. Users get no feedback about *what's* wrong — the button is just grayed out. Server-side Zod schemas in `link-actions.server.ts` catch invalid URLs and empty titles, but errors surface as a generic catch-block message at the bottom of the form.

**Goal**: Add a reusable client-side validation layer with inline field errors, required-field indicators, URL format validation, and character limits. Keep server-side Zod schemas as the canonical validation; client-side is UX feedback only.

## Files to Modify

1. **`apps/www/src/components/modal/use-form-validation.ts`** — NEW. Reusable validation hook.
2. **`apps/www/src/components/modal/link-modal.tsx`** — Integrate validation hook, add inline errors.
3. **`apps/www/src/components/modal/link-modal.tsx`** — Update `Field` component to support error/required props.

## Files NOT to Modify

- `link-actions.server.ts` — server Zod schemas stay as-is (they're already correct)
- `tag-chip-input.tsx` — already validates (trim, lowercase, dedup)
- `status-toggle.tsx` — binary toggle, no validation needed

## Steps

### Step 1: Create `use-form-validation.ts` hook

Create `apps/www/src/components/modal/use-form-validation.ts`.

A generic, reusable validation hook with this shape:

```ts
type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  required?: boolean;
  rules?: ValidationRule<T>[];
};

type SchemaConfig = Record<string, FieldConfig<any>>;
```

The hook should:
- Accept a schema config object and the current form values
- Expose `errors: Record<string, string | undefined>` — first failing rule message per field
- Expose `validate(): boolean` — runs all rules, sets errors, returns true if valid
- Expose `touched: Record<string, boolean>` and `touch(field: string)` — errors only show after a field is touched or after `validate()` is called
- Expose `isValid: boolean` — derived from errors state
- NOT auto-validate on every keystroke (performance) — validate on blur (`touch`) and on submit (`validate`)

### Step 2: Define link form validation schema

In `link-modal.tsx`, define the validation schema for the link form:

- **url**: required, must match URL pattern (`/^https?:\/\/.+/`), max 2000 chars
- **title**: required, max 200 chars
- **description**: optional, max 1000 chars
- **imageUrl**: optional, but if non-empty must match URL pattern, max 2000 chars

These limits are generous — they prevent garbage, not real use.

### Step 3: Integrate validation into `LinkModal`

In the `LinkModal` component:

1. Call `useFormValidation(schema, form)` 
2. On each field's `onBlur`, call `touch(fieldName)`
3. In `handleSave`, call `validate()` first — if invalid, return early (don't call server)
4. Replace the `disabled={saving || !form.title.trim() || !form.url.trim()}` check on Save button with `disabled={saving}` — validation errors will be visible inline
5. Keep the existing `error` state for server-side errors (network failures, etc.)

### Step 4: Update `Field` component for error display and required indicator

Modify the `Field` component (currently at line 296) to accept optional `error?: string` and `required?: boolean` props:

- If `required`, render a `*` after the label text in the accent color
- If `error` is truthy, render a `<p>` below the children with the error message in `text-red-600`, `text-[0.75rem]`
- When error is present, add a `ring-red-400` or `border-red-400` visual cue — pass this as a className or via a wrapping div. Since `Field` renders `{children}` (the input), the simplest approach is to wrap children in a container that adds a CSS class when errored, but inputs already have their own border. Instead, pass `aria-invalid` context: add a `data-error` attribute to the wrapper so inputs can be styled with `[data-error=true]_&:border-red-400` or use a simpler approach — just show the message below and let the red text be the signal.

### Step 5: Wire field errors in the form JSX

For each field in the form section (URL, Title, Description, Image URL):

```tsx
<Field label="URL" required error={errors.url}>
  <input
    ...existing props...
    onBlur={() => touch('url')}
  />
</Field>
```

### Step 6: Update `UrlEntryStage` validation

The `UrlEntryStage` component (line 262) should also validate URL format before submitting. Add basic URL format check (`/^https?:\/\/.+/`) — if invalid, show inline error. This is simpler than the full hook since it's a single field; a local `useState` for the error is fine.

### Step 7: Verify

- Run `cd apps/www && bun run typecheck` — no errors
- Run `bun run test` from root — all suites pass
- Manual verification criteria:
  - Required fields (URL, Title) show `*` indicator
  - Leaving a required field empty and blurring shows "Required" error
  - Entering an invalid URL format shows "Must be a valid URL" error
  - Exceeding character limit shows "Must be under X characters" error
  - Errors clear when the field is corrected
  - Save button attempts validation on click; if invalid, errors appear on all invalid fields
  - Valid form still saves normally (create and edit modes)

## Acceptance Criteria

1. `bun run typecheck` passes with zero errors
2. `bun run test` (root) passes all suites
3. Required fields show `*` after label
4. Inline error messages appear below fields on blur and on submit attempt
5. URL fields validate format (must start with `http://` or `https://`)
6. Character limits enforced: title 200, description 1000, URLs 2000
7. Errors clear when user fixes the value
8. `useFormValidation` hook is generic — not coupled to link form types
9. Edit mode pre-fills form and does not show errors until user interacts

## Code Graph Context

Files your task will modify and their relationships:

### apps/www/src/components/modal/link-modal.tsx
**Imports:** @tanstack/react-query, react, sonner, @www/components/ui/dialog, @www/lib/link-actions, ./link-modal-context, ./status-toggle, ./tag-chip-input

## Rules

# API Architecture — CQRS + Separation of Concerns

## Directory Structure

```
apps/api/src/
  routes/         # Route definitions only
  validators/     # Zod schemas for request validation
  queries/        # Read operations (GET)
  commands/       # Write operations (POST, PATCH, DELETE)
  lib/            # Shared utilities (normalization, helpers)
  middleware/     # Hono middleware (auth, etc.)
```

## Routes

Route files define HTTP endpoints. They do three things:

1. Parse and validate the request (call validator)
2. Call the appropriate query or command
3. Return the response

Routes do NOT contain business logic, database queries, or data transformation.

```ts
// WRONG — route file doing everything
linksRoutes.post('/api/links', auth, async (c) => {
  const body = schema.safeParse(await c.req.json());
  // ...50 lines of db queries, tag normalization, joins...
  return c.json(result, 201);
});

// CORRECT — route delegates to validator + command
linksRoutes.post('/api/links', auth, async (c) => {
  const parsed = createLinkSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({error: 'Invalid request', details: parsed.error.flatten()}, 400);

  const result = await createLink(parsed.data);
  return c.json(result, 201);
});
```

## Validators

One file per resource. Exports Zod schemas for each operation.

```ts
// validators/links.ts
export const createLinkSchema = z.object({ ... });
export const updateLinkSchema = z.object({ ... });
export const listLinksParamsSchema = z.object({ ... });
```

## Queries (Read)

One file per query. Pure function: takes typed params, returns typed result. Owns its database query logic.

```ts
// queries/list-links.ts
export async function listLinks(db: Database, params: ListLinksParams): Promise<ListLinksResult>
```

## Commands (Write)

One file per command. Pure function: takes typed input, performs the write, returns typed result. Owns its transaction logic.

```ts
// commands/create-link.ts
export async function createLink(db: Database, input: CreateLinkInput): Promise<LinkWithTags>
```

## Rules

- One query or command per file
- Queries never mutate; commands never return lists
- Shared logic (tag upsert, normalization) lives in `lib/`
- Database instance passed as first argument (not imported as module-level singleton)
- Route files import from validators/, queries/, commands/ — never from drizzle-orm directly

---

# Design Tokens — CSS Variables, Theming, and shadcn/ui

## CSS Variable Structure

Three layers of tokens in `apps/www/src/globals.css`:

- **App tokens**: `--bg`, `--bg-subtle`, `--border`, `--text`, `--text-muted`, `--text-faint`, `--accent`, `--accent-hover`, `--accent-foreground` — used directly in custom components.
- **shadcn tokens**: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--destructive`, `--ring`, `--input`, `--radius` — standard shadcn/ui mapping.
- **Component tokens**: `--tag-bg`, `--tag-text`, `--tag-active-bg`, `--tag-active-text`, `--modal-bg`, `--search-bg`, `--pill-bg`, `--pill-text` — scoped to specific UI elements.

All tokens defined in `:root`, overridden in `.dark` class.

## Theme — Stone & Slate

- **Light**: off-white base (#f4f2f0), dark text (#1e1e1e), slate-blue accent (#5b6f8a)
- **Dark**: charcoal base (#1a1c1e), cream text (#e2e4e8), light slate-blue (#7b96b5)
- Dark mode uses `.dark` class toggle on `html` (not `prefers-color-scheme`), with localStorage persistence
- Neutrals are warm-tinted (no cool grays, no pure black/white)

## Typography

- `font-serif` (Lora) — headings, titles, display text
- `font-sans` (DM Sans) — body, UI chrome, buttons, labels

## Using Tokens in Components

- Use Tailwind classes mapped in `tailwind.config.ts`: `bg-bg`, `text-text`, `bg-accent`, `text-text-muted`
- shadcn tokens: `bg-primary`, `text-foreground`, `bg-card`, `bg-muted`
- Border radius: `rounded-lg` (0.5rem), `rounded-md` (calc), `rounded-sm` (calc) — all derived from `--radius`
- Use `cn()` from `src/lib/utils.ts` for class merging

## Adding New shadcn/ui Components

1. Install via `npx shadcn@latest add <component>` from `apps/www/`
2. Components land in `src/components/ui/` — auto-use the token system
3. Review the generated file after adding:
   - Replace default gray/slate colors with app's warm palette (`bg-bg`, `text-text`, `bg-muted`)
   - Replace `font-sans` default with appropriate font (`font-serif` for headings in dialogs/cards)
   - Ensure focus states use `ring-accent` not default blue
   - Match border radius to existing components (check `button.tsx`, `dialog.tsx` for patterns)

## Adding New Tokens

- Define in both `:root` and `.dark` blocks in `globals.css`
- Add Tailwind mapping in `tailwind.config.ts` `colors` extend
- Use semantic names (`--sidebar-bg`) not raw values (`--blue-200`)
- Keep warm palette — no cool grays, no pure blacks/whites

---

# Drizzle ORM Patterns

## .$dynamic() for Conditional Query Composition

Drizzle's query builder locks the return type at each chain step. After `.from().innerJoin()...`, TypeScript freezes the type signature — adding `.where()` to a reassigned `let query` causes a type error because the builder types don't match.

`.$dynamic()` is the escape hatch. Call it after building the base query chain to opt into a looser type that permits conditional chaining:

```ts
let query = db
  .select({...})
  .from(table)
  .innerJoin(...)
  .innerJoin(...)
  .$dynamic();  // ← unlocks conditional chaining

if (condition) {
  query = query.where(eq(col, value));
}

return query.groupBy(...).orderBy(...);
```

**When to use**: Multi-join queries where `.where()`, `.orderBy()`, `.having()`, or additional `.innerJoin()` calls are conditional.

Example: `packages/domain/src/queries/get-tags-with-count.ts` — filters by link status only if provided.

## Conditions Array Pattern

When only `.where()` conditions vary (no conditional joins), avoid `.$dynamic()`. Instead, build a `conditions[]` array and pass it to a single `.where(and(...conditions))`:

```ts
const conditions = [];
if (needs_enrichment) conditions.push(isNull(link.content));
if (status) conditions.push(eq(link.status, status));
if (q) conditions.push(or(ilike(link.title, `%${q}%`), ...));

const where = conditions.length > 0 ? and(...conditions) : undefined;
return db.select().from(link).where(where)...;
```

This is simpler, preserves full type safety, and scales better than `.$dynamic()`.

Example: `packages/domain/src/queries/list-links.ts` — many optional filters, one `.where()` call.

## Rule

- Use `.$dynamic()` only when you need to conditionally chain clauses beyond `.where()` (e.g. `.innerJoin()`, `.having()`, `.groupBy()`).
- For conditional `.where()` only, use the conditions array pattern — it's clearer and type-safe.

---

# Systematic Debugging Protocol

## Four Phases (in order)

### 1. Reproduce
- Get a reliable reproduction before changing anything
- Capture the exact error message, stack trace, exit code
- If you can't reproduce, you don't understand the problem yet

### 2. Pattern Analysis
- Read the error carefully — what is it actually saying?
- Check recent changes that could have caused this
- Look for similar patterns in the codebase (same error, same API, same module)

### 3. Hypothesis + Test
- Form one specific hypothesis: "X is failing because Y"
- Design a test that confirms or refutes it before implementing a fix
- If the hypothesis is wrong, return to phase 2

### 4. Implementation
- Fix the root cause, not the symptom
- Verify the fix resolves the reproduction from phase 1
- Check for other call sites that might have the same issue

## Three-Fix Escalation Rule

After 3 failed fix attempts on the same issue:

- **Stop fixing**
- The problem is likely architectural, not local
- Run `/debug` to check for session-level explanations (tool failures, API errors, context issues) before flagging attention
- Flag attention with a summary of what you tried, why each attempt failed, and any `/debug` findings
- Do not continue treating symptoms

---

# Deduplication

## Search Before Implementing

Before writing a utility function, grep the codebase for existing implementations:

```bash
grep -r "functionName\|similar purpose" packages/ apps/ --include="*.ts" -l
```

If an equivalent exists, import it — don't rewrite it. Duplicate logic means two places to update when behavior changes.

## Types in packages/shared

Before defining a new type inline, check `packages/shared/src/types.ts`. If a type is used by 2+ packages, it belongs in shared — define it once, import everywhere.

```ts
// WRONG — same type defined in apps/mcp and apps/hud separately
type TaskStatus = 'planned' | 'executing' | 'done';

// CORRECT — defined once in packages/shared/src/types.ts, imported everywhere
import type {TaskStatus} from '@worksite/shared';
```

## No "Keep in Sync" Comments

If two constants must have the same value, one must import from the other. A comment saying "keep in sync" is a deferred bug — it will drift.

```ts
// WRONG — comment dependency, guaranteed to diverge
// Keep in sync with apps/hud/src/constants.ts
export const MAX_TASKS = 50;

// CORRECT — single source of truth
export {MAX_TASKS} from '@worksite/shared';
```

## Extract on Second Use

When you find yourself copying a function or block of code:

- **Cross-package**: extract to `packages/shared/src/`
- **Within a package**: extract to a local `utils.ts` or sibling module

The test: if you're about to write the same logic twice, extract it first.

---

# Documentation Structure

## Three-Tier Model

Organize project knowledge into three layers:

### `/docs/` — Domain & Business Knowledge
- Architecture, concepts, workflows, subsystem guides
- One file per topic, small and focused (under ~80 lines)
- Written for humans and agents who need to understand the system
- Examples: `docs/architecture.md`, `docs/auth-flow.md`, `docs/api-design.md`

### `CLAUDE.md` — Overview + Table of Contents
- Project identity and execution rules (under 50 lines)
- Links to `/docs/` files for domain knowledge
- Links to `.claude/rules/` for technical rules
- NOT a dumping ground — if a section grows past 10 lines, extract it

### `.claude/rules/` — Technical Code Rules
- Coding conventions, tool preferences, testing patterns, gotchas
- One file per topic (e.g., `testing.md`, `typecheck.md`, `bun.md`)
- Focused on "how to write code here" not "what the system does"

## Principles
- Many small files > fewer large files
- Each file is self-contained with a clear single topic
- Domain knowledge (what/why) lives in `/docs/`
- Technical rules (how) live in `.claude/rules/`
- `CLAUDE.md` is the entry point, not the encyclopedia

---

# Worksite Planner — Role Boundaries

## Identity

You are a planner. You read the codebase and produce executable plans for `todo` tasks.
Your output is the `plan` field on the task — not code, not commits, not files.

## Read-Only Boundary

You do NOT write code, create commits, push branches, or modify repository files.

Banned operations:

- `git commit`, `git push`, `git add`, `git merge`, `git rebase`
- `Write` tool, `Edit` tool, `NotebookEdit` tool

The only state you may update is via `update_task` — plan, title, type, fileIntents, status.

## Iterative Planning

Update the task's `plan` field as you work — don't wait until the end.
Show your thinking so the user can course-correct early.

```ts
update_task({id: taskId, plan: '## Context\n...'});
```

Call `update_task` after each major discovery. A draft plan is better than no plan.

## Questions

When you need user input, call `update_task` with a clear, specific `attentionMessage`.
Ask one question at a time. The stop hook handles lifecycle — do not try to exit manually.

## Plan Quality

Plans must be self-contained — workers are autonomous and cannot ask questions.

Every plan must include:

- **Context**: the problem, trigger, intended outcome
- **File paths**: specific files to create, modify, or delete
- **Steps**: ordered implementation steps, each one clear action
- **Acceptance criteria**: user-observable behaviors, not just "typecheck passes"

Vague descriptions ("update the relevant file") are not acceptable. Name the file and function.

## Completion

When the plan is complete and meets quality standards:

```ts
update_task({
  id: taskId,
  title: 'concise imperative title, max 60 chars',
  type: 'feat', // or fix, refactor, test, docs, chore, perf
  plan: '## Context\n...',
  fileIntents: ['path/to/file1.ts', 'path/to/file2.ts'],
  status: 'planned',
});
```

Setting `status: 'planned'` signals human review. The user promotes to `ready` when satisfied.
Do NOT call `/exit` or `Skill(exit)` — they do not exist. The stop hook handles lifecycle.

## Follow-Up Ideas

When planning surfaces ideas outside the current task scope, log them:

```
create_idea({ prompt: "[task:{your-task-id}] description of the idea" })
```

---

# Worksite Planning

## Plan Field Structure

Workers are autonomous — they cannot ask clarifying questions once launched.
Every plan must be self-contained.

### Include
- **Context**: the problem, the trigger, the intended outcome
- **File paths**: specific files to create, modify, or delete
- **Steps**: ordered implementation steps; each step is one clear action
- **Acceptance criteria**: tests pass, type-checks, specific observable behavior

### Omit
- Setup the system handles: worktree creation, bun install, branch checkout
- Repo-level rules: CLAUDE.md, code style, git conventions — the worker inherits these
- Over-specified implementation: the worker is a senior engineer, not a typist

## Scoping
- One task = one PR; if it can't be reviewed in one sitting, it's too big
- Prefer a task that touches one subsystem over one that cuts across many
- If a change requires coordination across tasks, note the dependency explicitly

## Context Budget

Workers have a finite context window (~200k tokens). Plan decomposition must
account for this — a task that exhausts context crashes the worker and loses
all progress.

### Estimating Context Pressure

Each of these consumes significant context:
- Reading a file: ~1-5k tokens per file
- Running typecheck: ~1-2k tokens per run
- Running test suite: ~2-5k tokens per run
- Git operations (status, diff, commit): ~1-2k tokens each
- Creating a PR (gh pr create): ~1-2k tokens

A task that touches 5+ files AND requires multiple verification cycles
(typecheck both apps, full test suite, commit, PR) is high-pressure. Consider
splitting into two tasks with an explicit dependency.

### Split Heuristic

If a plan has ALL of these, split it:
- 6+ files modified/created
- Multiple verification targets (e.g. both MCP and HUD typecheck)
- Full test suite run
- PR creation with detailed description

Split along natural seams: store/backend changes in one task, UI/frontend
in another. The second task depends on the first.

---

# Worksite Reviewer — Role Boundaries

## Identity

You are a code reviewer. You review PRs for quality, correctness, and adherence to the task plan.

## Hard Exclusions

You do NOT:

- Write code fixes or patches — flag findings for the worker to address
- Create commits or push code
- Transition tasks to states other than what the review protocol specifies
- Create PRs or branches
- Modify files in the worktree — read-only operations only
- Dismiss your own findings — if you flagged it, it stays flagged

## Communication Protocol

- Post findings as GitHub PR comments (inline where possible)
- Use `update_task` with `reviewSummary` and `reviewScore` for the structured assessment
- Use `attentionMessage` + `attentionTarget: "worker"` when changes are requested
- Use `attentionMessage` + `attentionTarget: "human"` only for architectural concerns needing human judgment

## Git Prohibition

You MUST NOT run any git write command. Banned commands:

- `git commit` — commits stay with the worker
- `git push` — pushing is the worker's responsibility
- `git add` — staging is the worker's responsibility
- `git merge`, `git rebase`, `git reset` — no branch manipulation

Read-only git commands are permitted: `git diff`, `git log`, `git show`, `git status`.

## Scope

Review the diff, the plan, and the acceptance criteria. Verify claims match code changes. Do not expand scope beyond the PR's stated intent.

## Stub Detection — T2

Flag as T2 (request changes) when the diff contains implementation that looks
complete but is actually a stub:

- Empty function bodies or functions that only `return null` / `return undefined`
- Handlers that only `console.log` without performing the stated action
- `// TODO`, `// placeholder`, `// implement later` as the sole implementation
- `fetch()` / API calls where the response is not used or only logged
- Components rendering hardcoded text where the plan specifies dynamic data
- Test files where assertions only check `toBeDefined()` without testing behavior

These patterns pass typecheck and may pass tests, but do not deliver the plan's
stated outcome. Verify that implementation matches the plan's acceptance criteria
truths, not just that code exists.

---

# Verification Before Completion

Evidence before claims, always.

## Gate

Before claiming a task is complete, run through this sequence:

1. **Identify** the proof command (typecheck, test suite, build, curl, etc.)
2. **Execute** it fresh — not from cache, not from memory
3. **Read** the full output — do not skim or assume
4. **Verify** the output matches expectations (exit code 0, no failures, expected behavior)
5. **Only then** claim the task is done

## Language

Never use hedge words when reporting completion:
- "should work" — run it and confirm
- "probably passes" — run it and confirm
- "seems correct" — run it and confirm
- "I believe this is done" — prove it

## Full Suite is Mandatory

The proof command for test verification is `bun run test` (the root script that runs
all 4 suites in separate processes). Not `bun run --cwd <package> test` — the full suite.

- You own every test failure on your branch, not just tests for files you touched.
- Do not attribute failures to "pre-existing", "not my change", or "outside scope."
- If tests fail that you didn't cause, fix them anyway — or flag attention and pause.
- Never complete a task, submit for review, or create a PR with failing tests.

## Scope

This applies to every task type — features, fixes, refactors, tests, docs, chores.
Even doc-only tasks: verify the file renders, links resolve, code examples are valid.

---

# Worksite Worker — Autonomous Behavior

## "Ask the user" means "flag attention"

You are an autonomous worker with no interactive user. Whenever instructions
(including skill prompts like /wrap-up or /review) say "ask the user",
"confirm with the user", or "get user input":

1. Call `update_task` with `attentionMessage: "concise reason"`
2. Continue working on any independent steps you can
3. Never wait silently — the orchestrator only sees `needsAttention`

## Blockers

When you hit a blocker you cannot resolve — test failures after 2 attempts,
missing dependencies, permission errors, environment issues, or reviewer
disagreements — immediately flag attention. This applies in ALL phases:
planning, executing, wrap-up, review, and during any skill execution.

## Never Sit Idle

You have no interactive user. If you ever find yourself waiting — for confirmation,
for input, for permission, or for any reason — you are stuck. There is nobody coming
to help unless you signal.

Before stopping or pausing for any reason:
1. Call `update_task` with `attentionMessage: "reason you stopped"`
2. Then continue working on anything else you can

This applies universally: bash failures, tool errors, ambiguous instructions,
uncertainty about next steps, permission denials — anything that would cause you
to pause. The default action is always to flag and continue, never to wait silently.

## Context Hygiene

Your context window is finite. Running out crashes the session and loses all
progress. Treat context as a budget.

### Checkpoint Compaction

Run `/compact` after each major phase of work:
- After implementing a group of related changes
- After running typecheck
- After running tests
- After committing and pushing

Include a brief summary of what was completed and what remains when compacting.
This preserves progress context while freeing token budget for the next phase.

### Minimize Context Waste

- Use `grep` / `glob` before reading full files — only read what you need
- For test, typecheck, and gh output: use `run_compressed` MCP tool for automatic compression
- `| head -20` is acceptable for git status, simple listings — NOT for diagnostic output
- Don't re-read files you've already read unless they changed
- Use `--quiet` flags on git and build commands where available

## Follow-Up Ideas

When you discover something worth doing but outside your current task scope —
improvements, refactors, bugs, new features — log it as an idea:

```
create_idea({ prompt: "[task:{your-task-id}] description of the idea" })
```

Always prepend `[task:{id}]` so the orchestrator knows which task spawned it.
Do this for reviewers too — if a review surfaces a follow-up, log it.
## Inbox
- At the start of execution, call `check_inbox` to read any messages from the orchestrator.
- Periodically (every 10-15 minutes of active work), call `check_inbox` to check for new directives.
- Call `send_progress` with your task ID and a brief status update after completing each major step.

## Flagging Attention
See `.claude/rules/worksite-worker.md` for full guidance. In short:
- **Any time you would stop or wait** → `update_task` with `attentionMessage: "reason"`
- There is no interactive user. If you are not making progress, flag immediately.
- After flagging, continue working on anything you can.

## File Intent Declaration
Early in execution, call `update_task` with `fileIntents` listing the repo-relative paths of files you plan to modify (derived from the plan). Update as your understanding evolves. This lets the orchestrator detect conflicts with parallel tasks.

## Execution Workflow

## Reflection Re-engagement
If the task notes include "re-engaged worker for reflection phase", you were re-engaged after the reviewer approved your PR. Your sole job is to capture learnings and transition to `user_review`. Do not implement new features or reopen the task.

Steps (15 minutes max):
1. Scan your task notes and PR diff for insights worth preserving
2. Call `update_task({ learning: "..." })` for each meaningful learning (max 3-4)
   - Capture: initial wrong approaches, non-obvious patterns, project-specific gotchas
   - Skip: things that went smoothly, obvious language features
3. Call `create_idea({ prompt: "[task:366daebc] ..." })` for out-of-scope improvements (max 2)
4. Call `update_task({ note: "Retrospective: <2-3 sentences on what went well and what to improve>" })`
5. Call `update_task({ status: 'user_review', note: 'Reflection complete — ready for user review' })`
6. Your job is done after the `update_task` call above.

---

1. Execute the plan above
   **Tip**: For test and typecheck commands, prefer the `run_compressed` MCP tool over direct Bash. It compresses high-volume output to save context tokens. Pass `cwd` if running from a worktree path.
   **IMPORTANT — Testing**:
   - NEVER use bare `bun test` from the repo root. It loads all 145+ test files into one process and crashes the session.
   - While implementing, test the packages you changed: `bun run --cwd apps/mcp test`, `bun run --cwd packages/store test`, etc.
   - Before committing, you MUST run the full suite via `bun run test` (the root script runs all 4 suites in separate processes safely). All tests must pass.
2. **Self-review quality gate** — run `/review` (no arguments — it reviews your diff).
   a. Read the grade table output. If overall grade is A: proceed to step 3.
   b. If grade is B or below: fix each finding, re-run typecheck and tests, then run `/review` again.
   c. Repeat until you get an A. If stuck after 3 `/review` cycles without reaching A, note the remaining issues and proceed — the reviewer will catch them.
   d. Verify acceptance criteria: for each criterion in the plan, run its proof command fresh and confirm output.
3. **Full test gate** — run `bun run test` (full suite, all packages).
   - If ANY tests fail, fix them. You own every failure, not just tests for files you touched.
   - Do not attribute failures to "pre-existing issues" or "outside scope." If tests fail on your branch, they block your task.
   - If you cannot fix a failure after 2 attempts, flag attention — do NOT proceed to commit.
   - Exit code must be 0 before proceeding.
4. Commit task work directly — do NOT use /commit (it prompts interactively):
   git add <specific files changed by the task>
   git commit -m "type(scope): subject"
   Follow conventional commits format. One logical commit per task.
5. Push: git push -u origin feat/add-inline-form-validation-to-link-modal
6. Create the label and PR:
   gh label create "Working" --description "Task in progress" --color "1d76db" --force 2>/dev/null || true
   gh pr create --title "Add inline form validation to link modal" --label "Working" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points summarizing the change>

## Test plan
<checklist of verification steps>
EOF
)"
7. **Self-Reflection** (2-3 minutes max — this is reflection, not a second implementation phase):

   **What to capture:**
   - Skill gap: things that took multiple attempts or where your initial approach was wrong
   - Friction: manual steps that could be automated (hooks, rules, scripts)
   - Knowledge: project facts not previously documented
   - Automation: patterns that could become `.claude/rules/` entries

   **How to capture:**
   - Debugging insights, patterns, project quirks → `update_task({ learning: "..." })` (max 3-4)
   - Permanent project conventions discovered → `create_idea({ prompt: "[task:366daebc] Add rule: ..." })` (max 2)
   - If a `.claude/rules/` change is small and clearly in scope: apply it directly, commit, push
   - Session-specific context (one-off details) → skip, don't persist

7. Call worksite `submit_for_review` with the PR URL — this transitions the task and signals the system. Your job is done after this call.

## Re-engagement After User Feedback
If the task notes include "User left PR feedback — re-engaged worker to address comments", you were restarted by the system to address user feedback on the PR. Skip steps 1–8 and go directly to the User Feedback section below.

## Merge Conflict Re-engagement
If the task notes include "PR has merge conflicts — re-engaged worker to rebase onto main", you were restarted to rebase your PR branch onto main. Skip steps 1–8 and do the following:
1. `git fetch origin main && git rebase origin/main`
2. Resolve any conflicts, run typecheck and tests to verify
3. `git push --force-with-lease`
3b. **Verify clean state**: run `git status` (must show "nothing to commit, working tree clean") and `git log origin/feat/add-inline-form-validation-to-link-modal..HEAD` (must show 0 commits). If not clean or unpushed commits remain, push again.
4. If rebase fails after 2 attempts, flag attention: `attentionMessage: "Merge conflicts I cannot resolve: <summary>"`
5. Call worksite `update_task` with `status: 'user_review'` and `note: 'Resolved merge conflicts — returning to user review'` — do NOT call `submit_for_review`; the reviewer already approved the core implementation

## ROLE: You are a WORKER, not a reviewer

You write and fix code. Running `/review` on your own diff as a self-review quality gate is expected and encouraged. You do NOT review other PRs. The following are strictly prohibited:
- Posting PR review comments (`gh pr review`, `gh api .../reviews`)
- Grading other people's code (A/B/C/D/F scores, tiered findings on PRs you didn't author)
- Writing review summaries or assessments of others' PRs
- Calling `update_task` with `reviewSummary` or `reviewScore`

If you see a file named `.worksite-review.md` in the worktree, **ignore it** — it is for the automated reviewer, not you.

## Reviewer Feedback Re-engagement
If the task notes include "re-engaged worker to address reviewer feedback", you were restarted by the system because the automated reviewer requested changes on your PR. Skip steps 1–8 and do the following:
1. Check your inbox: call worksite `check_inbox` with your task ID — the directive contains the reviewer's specific findings
1.5. Capture what the reviewer caught: call `update_task` with `learning:` describing the pattern.
     Format: "Reviewer flagged [what] because [why] — [takeaway for future tasks]"
     This happens before fixing so you capture the insight while context is fresh.
2. Read the Restart Context above — it contains the PR diff showing your current code vs main. Use this to locate the exact code that needs fixing.
3. For EACH finding (T4/T3 first, then T2):
   a. `grep` the file for the problematic pattern to confirm it exists
   b. Read the relevant lines — if the Read tool is blocked by read-once, use: `cat -n <file> | sed -n '<start>,<end>p'`
   c. Edit the file using the EXACT `old_string` from what you just read (not from memory)
   d. After editing, `grep` again to confirm the pattern is GONE. If it persists, your edit failed — re-read and retry.
4. Run typecheck and tests AFTER all findings are addressed
5. Commit and push the fixes
6. **Verify clean state** before considering your work done:
   - `git status` — must show "nothing to commit, working tree clean"
   - `git log origin/feat/add-inline-form-validation-to-link-modal..HEAD` — must show 0 commits (all pushed)
   If either check fails, stage/commit/push the remaining changes before proceeding.
7. The reviewer will automatically re-review after detecting new commits — do NOT call `submit_for_review` again
8. If you disagree with a finding after one attempt: call `update_task` with `attentionMessage: "Reviewer disagreement: <summary>"` — do NOT keep trying
9. Once fixes are pushed, your job is done. The daemon detects new commits and re-launches the reviewer automatically.

## User Feedback (re-engaged case)
9a. Read the PR comments: `gh pr view https://github.com/jgretz/schwankie/pull/30 --json comments,reviews`
9b. Fix the code for each piece of feedback, commit, and push
9b2. **Verify clean state**: run `git status` (must show "nothing to commit, working tree clean") and `git log origin/feat/add-inline-form-validation-to-link-modal..HEAD` (must show 0 commits). If not, stage/commit/push remaining changes.
9c. When all feedback is addressed, call worksite `submit_for_review` with the PR URL — this sends your fixes through automated review before returning to the user.
9d. Your job is done after the `submit_for_review` call above.



## Repo Patterns

Accumulated knowledge from previous tasks in this repository:

### Environment Quirks
- Documentation-first approach effective for architecture decisions. Writing the markdown upfront clarified trade-offs (metascraper vs unfurl.js, CF Browser Rendering vs CommonCrawl) before any code is committed. This forces concrete decisions early: named packages, specific API endpoints, cost analysis. Pattern: use docs as design specification before implementation tasks.
- Documentation-first architecture specification clarifies trade-offs before code. Named packages, specific API endpoints, cost analysis in markdown forces concrete decisions upfront.
- Two-layer normalization pattern separates deterministic rules (sync, pure function) from semantic classification (async, LLM-based). This cleanly avoids the false choice between \"hardcoded heuristics\" (brittle) and \"LLM on every save\" (slow). Phased implementation roadmap in design docs prevents massive multi-phase commits and clarifies dependencies.",antml:parameter>
<parameter name="note">Retrospective: Documentation-only task executed cleanly. Clear acceptance criteria meant no ambiguity; two-layer architecture design is sound and ready for implementation. Created tag-normalization.md with problem statement, concrete rules, SQL schemas, Ollama prompt, and phased roadmap. Logged two follow-up implementation tasks."

### Testing Patterns
- Reviewer flagged: (1) Position-dependent auth via Hono registration order is fragile — use per-route middleware params instead. (2) Type assertions on query params (`as 'saved'|'queued'`) bypass runtime validation — always use Zod safeParse. (3) Number() on route params needs NaN guard before DB query. (4) Per-tag upsert is N+1 — batch INSERT + single SELECT WHERE IN. (5) Pagination nextOffset should be capped at total to avoid returning offsets beyond dataset.
- CQRS separation working well: route validates and delegates to query, query owns DB logic and tag join, client call wraps the HTTP call. This clean separation makes the code easy to test and reason about. The pattern of "one file per query" makes files small and focused.

### Architecture Conventions
- Tag upsert pattern: When upserting tags, insert on conflict do nothing, then select by text to retrieve the ID. This avoids race conditions and ensures we always get back the tag record. Used in upsertTags helper to handle both new and existing tags uniformly.
- Reviewer flagged N+1 in upsertTags (2 queries per tag). Batch pattern: single INSERT...ON CONFLICT DO NOTHING for all tags, then single SELECT WHERE text IN (...) to get IDs.
- Reviewer flagged Drizzle TS2741 — chaining two .innerJoin() calls removes .where() from the builder's type signature. Fix: call .$dynamic() after the joins to restore the full query builder type. Pattern: any conditional .where() after multiple joins needs .$dynamic().

### Known Gotchas
- Reviewer flagged FK constraint contradiction with stated immutability invariant — when a doc says a table is an immutable audit trail but the DDL uses ON DELETE CASCADE, the constraint actively violates the claim. Always align FK referential actions (RESTRICT/CASCADE/SET NULL) with the documented invariants of the table.
- Restarted session can skip straight to verification+commit+PR when implementation_complete milestone was reached. Pre-existing typecheck errors in sibling apps (www) and shared packages (database schema Drizzle type issues) don't block api-scoped work.
- drizzle-orm version must match exactly between packages/database and any consumer (apps/api, apps/tasks). The schema package uses 0.30.10; adding ^0.30.10 or higher resolves to 0.38.x which has incompatible SQL/Column types. Pin with exact version: \"drizzle-orm\": \"0.30.10\" (no caret).
