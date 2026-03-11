import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {title: 'schwankie'},
      {name: 'description', content: 'Your second memory — a well-indexed collection of links.'},
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-16">
      <h1 className="font-serif text-4xl text-text">schwankie</h1>
      <p className="mt-4 text-text-muted">Your second memory.</p>
    </div>
  );
}
