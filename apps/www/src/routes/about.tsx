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
    </div>
  );
}
