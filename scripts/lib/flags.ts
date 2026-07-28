/**
 * Flag reading for repo CLI scripts.
 *
 * A hand-rolled `argv[argv.indexOf('--root') + 1]` yields `undefined` for a
 * valueless flag, so the `?? default` that follows silently substitutes the
 * default and the script runs against something the caller never asked for.
 * `readFlag` returns the default only when the flag is *absent*; a flag that is
 * present but carries no usable value throws.
 *
 * Convention: `.claude/rules/script-flags.md`. Enforced by
 * `tests/script-flag-parsing.test.ts`.
 */

export type ReadFlagOptions = {
  /** Returned only when the flag is absent entirely. */
  default?: string;
  /** Noun used in the thrown message, e.g. 'directory path'. Defaults to 'value'. */
  valueName?: string;
};

export function readFlag(
  argv: ReadonlyArray<string>,
  name: string,
  options: ReadFlagOptions & {default: string},
): string;
export function readFlag(
  argv: ReadonlyArray<string>,
  name: string,
  options?: ReadFlagOptions,
): string | undefined;
export function readFlag(
  argv: ReadonlyArray<string>,
  name: string,
  options?: ReadFlagOptions,
): string | undefined {
  const flag = `--${name}`;
  const inlinePrefix = `${flag}=`;
  const valueName = options?.valueName ?? 'value';

  // First occurrence wins, matching the `indexOf` semantics this replaced.
  const index = argv.findIndex((arg) => arg === flag || arg.startsWith(inlinePrefix));
  if (index === -1) return options?.default;

  const arg = argv[index];
  const inline = arg.startsWith(inlinePrefix);
  const value = inline ? arg.slice(inlinePrefix.length) : argv[index + 1];

  if (value === undefined || value === '') throw new Error(`${flag} requires a ${valueName}`);

  // A separate token starting with `--` is the next flag, not this one's value.
  if (!inline && value.startsWith('--'))
    throw new Error(
      `${flag} requires a ${valueName} — write ${inlinePrefix}<${valueName}> for a value starting with "--"`,
    );

  return value;
}
