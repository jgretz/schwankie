export type IMAPFilterValidation = {valid: true} | {valid: false; error: string};

/**
 * Cheap client-side syntax check for an IMAP search filter: quotes must close and
 * parentheses must balance. It deliberately does not understand IMAP keywords — the
 * server is the authority on those; this only catches the two typos that make a filter
 * unparseable.
 */
export function validateIMAPFilter(filterStr: string): IMAPFilterValidation {
  if (!filterStr.trim()) return {valid: false, error: 'Filter is empty'};

  let parenCount = 0;
  let inQuotes = false;
  let escapeNext = false;

  // A character scanner is the clearest expression of this: each step depends on the
  // state the previous character left behind.
  for (const char of filterStr) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }
  }

  if (inQuotes) return {valid: false, error: 'Unclosed quoted string'};
  if (parenCount !== 0) return {valid: false, error: 'Unbalanced parentheses'};

  return {valid: true};
}
