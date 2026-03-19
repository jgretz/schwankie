# Monorepo Dependencies — Verify on Import

## Rule

When adding or encountering an import from an external package (npm, not `workspace:*`) in any `packages/*` or `apps/*` module, verify the dependency is declared in that package's `package.json`.

## Trigger

Any time you:
- Add an `import` from a non-relative, non-workspace module
- Move code that imports external packages into a different workspace package

## Check

```bash
grep '"<package-name>"' <workspace-package>/package.json
```

If missing: add it to `dependencies` and run `bun install`.

## Why

Bun resolves undeclared dependencies via monorepo hoisting locally. Production deployments only install declared dependencies — undeclared imports crash at runtime with no local signal (no type error, no build failure, no test failure).
