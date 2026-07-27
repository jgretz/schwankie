export type EmailMetaInput = {
  /** Pass null to hide the sender, e.g. when rows are already grouped by it. */
  emailFrom: string | null;
  emailSubject: string | null;
  date: string;
};

export type EmailMetaParts = {
  /** `sender · date`, or the date alone when the sender is hidden. */
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
  const sender = input.emailFrom?.trim();

  return {
    meta: sender ? `${sender} · ${input.date}` : input.date,
    subject: input.emailSubject?.trim() || null,
  };
}
