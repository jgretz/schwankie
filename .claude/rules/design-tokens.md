# Design Tokens — CSS Variables, Theming, and shadcn/ui

## CSS Variable Structure

Three layers of tokens in `apps/www/src/globals.css`:

- **App tokens**: `--bg`, `--bg-subtle`, `--border`, `--text`, `--text-muted`, `--text-faint`, `--accent`, `--accent-hover`, `--accent-foreground` — used directly in custom components.
- **shadcn tokens**: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--destructive`, `--ring`, `--input`, `--radius` — standard shadcn/ui mapping.
- **Component tokens**: `--tag-bg`, `--tag-text`, `--tag-active-bg`, `--tag-active-text`, `--modal-bg`, `--search-bg`, `--pill-bg`, `--pill-text` — scoped to specific UI elements.

All tokens defined in `:root`, overridden in `.dark` class.

## Theme — Stone & Slate

- **Light**: warm parchment base (#f7f3ed), dark text (#1e1e1e), slate-blue accent (#5b6f8a); tag chips use terracotta warm (#e4d5c4 bg, #4a3728 text)
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
