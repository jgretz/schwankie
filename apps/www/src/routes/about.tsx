import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      {title: 'About — schwankie'},
      {name: 'description', content: 'What is schwankie? A curated link compendium.'},
    ],
  }),
  component: AboutPage,
});

const feedLinkClass =
  'inline-flex items-center gap-2 text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:text-accent-hover hover:decoration-accent';

function RssIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36zM4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  );
}

function AboutPage() {
  return (
    <div className="mx-auto max-w-[640px] px-6 py-12 md:py-16">
      <h1 className="font-serif text-3xl font-semibold text-text">About</h1>
      <div className="mt-6 space-y-4 font-sans text-[0.95rem] leading-relaxed text-text-muted">
        <p>
          Schwankie is a curated link compendium — a &ldquo;second memory&rdquo; for things worth
          revisiting. Links are tagged, searchable, and organized into a browsable collection.
        </p>
        <p>
          Built and maintained by{' '}
          <a
            href="https://joshgretz.com"
            className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:text-accent-hover hover:decoration-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Josh Gretz
          </a>
          .
        </p>
      </div>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="font-serif text-xl font-semibold text-text">Feeds</h2>
        <div className="mt-3 space-y-3 font-sans text-[0.95rem] leading-relaxed text-text-muted">
          <p>
            The compendium is also available as a feed. Subscribe in the reader of your choice
            to get new public links as they&rsquo;re added.
          </p>
          <ul className="mt-4 space-y-3">
            <li>
              <a href="/rss" className={feedLinkClass}>
                <RssIcon />
                RSS
              </a>
            </li>
            <li>
              <a href="/atom" className={feedLinkClass}>
                <AtomIcon />
                Atom
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
