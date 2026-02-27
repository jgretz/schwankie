# React Component Resilience

Correctness and resilience patterns for production React components. These complement the `vercel-react-best-practices` skill (performance: waterfalls, bundle size, re-renders, server caching).

> **See also**: For React performance patterns, use the `vercel-react-best-practices` skill.

Source: https://shud.in/thoughts/build-bulletproof-react-components

---

## 1. Server-Proof

**Why**: Browser APIs (`localStorage`, `window`, `document`) don't exist in Node.js/SSR. Accessing them during render or at module top-level throws on the server.

**Rule**: Never access browser APIs during render or at module top-level. Defer to `useEffect`.

```tsx
// WRONG — crashes during SSR
const theme = localStorage.getItem('theme');

// CORRECT — deferred to client
useEffect(() => {
  const theme = localStorage.getItem('theme');
  setTheme(theme);
}, []);
```

---

## 2. Hydration-Proof

**Why**: `useEffect` runs *after* React hydrates, causing a visible flicker when DOM state (e.g. theme) doesn't match server HTML.

**Rule**: Inject a synchronous inline `<script>` via `dangerouslySetInnerHTML` to set DOM state before React hydrates.

```tsx
// WRONG — flickers: server renders default, effect applies theme after
useEffect(() => { document.body.className = theme; }, [theme]);

// CORRECT — state is set before hydration, no flicker
<script dangerouslySetInnerHTML={{ __html: `
  document.body.className = localStorage.getItem('theme') || 'light';
`}} />
```

---

## 3. Instance-Proof

**Why**: Hardcoded `id` attributes break when a component renders more than once — duplicate IDs cause broken `<label>` associations and accessibility failures.

**Rule**: Never hardcode DOM `id` attributes. Use `useId()` for stable unique IDs per instance.

```tsx
// WRONG — breaks when component renders twice
<label htmlFor="email">Email</label>
<input id="email" />

// CORRECT — unique per instance
const id = useId();
<label htmlFor={id}>Email</label>
<input id={id} />
```

---

## 4. Composition-Proof

**Why**: `React.cloneElement` and `React.Children.map` assume children are synchronous React elements. They fail silently with Server Components (Promises), lazy components, or cached trees.

**Rule**: Never use `React.cloneElement` or `React.Children.map` to inject props. Use Context.

```tsx
// WRONG — breaks with async/RSC children
React.Children.map(children, (child) =>
  React.cloneElement(child, { active })
);

// CORRECT — context works regardless of child type
<ActiveContext.Provider value={active}>
  {children}
</ActiveContext.Provider>
```

---

## 5. Portal-Proof

**Why**: `window` refers to the top-level window. Inside portals, iframes, or pop-out windows, the component's DOM node lives in a *different* window. Direct `window` access operates on the wrong context.

**Rule**: Resolve window from the DOM node: `ref.current.ownerDocument.defaultView`.

```tsx
// WRONG — wrong window inside iframes/portals
const rect = element.getBoundingClientRect();
const inView = rect.top < window.innerHeight;

// CORRECT — resolves the correct window for this DOM node
const win = ref.current.ownerDocument.defaultView;
const inView = rect.top < win.innerHeight;
```

---

## 6. Activity-Proof

**Why**: React's `<Activity>` component hides subtrees without unmounting. Components that inject `<style>` tags continue to apply styles even when hidden, overriding visible content.

**Rule**: Components injecting `<style>` tags must disable them when hidden. Use `useLayoutEffect` to toggle `media="not all"`.

```tsx
// WRONG — injected styles persist when component is hidden by <Activity>
useEffect(() => {
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}, [css]);

// CORRECT — disable style tag when hidden by <Activity>
const styleRef = useRef<HTMLStyleElement>(null);
useLayoutEffect(() => {
  if (styleRef.current) styleRef.current.media = isHidden ? 'not all' : '';
}, [isHidden]);
// <style ref={styleRef}>{css}</style> in JSX
```

---

## 7. Leak-Proof (RSC)

**Why**: Server Components can receive objects containing secrets (tokens, keys, PII). Passing such objects to third-party Server Components you don't control risks inadvertent exposure to the client.

**Rule**: Never pass objects with secrets to Server Components you don't own. Use `experimental_taintUniqueValue` / `taintObjectReference` to enforce at runtime.

```tsx
// WRONG — passes user object with auth token to third-party component
<ThirdPartyCard user={user} />

// CORRECT — taint the object to prevent accidental leakage
import { experimental_taintObjectReference } from 'react';
experimental_taintObjectReference('Do not pass user to client', user);
```

---

## 8. useMemo Correctness

**Why**: `useMemo` is a performance hint, not a guarantee. React may discard cached values at any time (e.g. during concurrent rendering). Code that depends on `useMemo` for *correctness* (not just perf) will break intermittently.

**Rule**: When correctness depends on value persistence across renders, use `useState` with the previous-props pattern (synchronous state update during render), not `useMemo`.

```tsx
// WRONG — assumes memo cache persists; React may discard it
const derived = useMemo(() => computeExpensive(input), [input]);

// CORRECT — previous-props pattern: synchronous state update during render
const [derived, setDerived] = useState(() => computeExpensive(input));
const [prevInput, setPrevInput] = useState(input);
if (input !== prevInput) {
  setPrevInput(input);
  setDerived(computeExpensive(input));
}
```
