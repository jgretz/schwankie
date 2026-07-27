export type EmailMetaInput = {
  /** Omit (or pass null) to hide the sender, e.g. when rows are grouped by it. */
  emailFrom?: string | null;
  emailSubject?: string | null;
  date: string;
};

export type EmailMetaParts = {
  /** `sender · date`, or just the date when the sender is hidden. */
  meta: string;
  /** Rendered as its own line; null means render nothing. */
  subject: string | null;
};

/**
 * Items ingested before the sender/subject split carry a null subject, so the
 * subject is returned separately rather than joined — a missing one must not
 * leave a dangling separator or an empty line.
 */
export function formatEmailMeta(input: EmailMetaInput): EmailMetaParts {
  const segments = [input.emailFrom, input.date].filter((segment): segment is string =>
    Boolean(segment && segment.trim()),
  );

  return {
    meta: segments.join(' · '),
    subject: input.emailSubject?.trim() || null,
  };
}
