import {createFileRoute, Link} from '@tanstack/react-router';

export const Route = createFileRoute('/admin/')({
  component: AdminHub,
});

function AdminHub() {
  const cards = [
    {
      to: '/admin/status',
      label: 'Status',
      description: 'Health of the task runner and imports',
      icon: '📡',
    },
    {
      to: '/admin/feeds',
      label: 'Feeds',
      description: 'Manage your RSS feed subscriptions',
      icon: '📰',
    },
    {
      to: '/admin/gmail',
      label: 'Gmail',
      description: 'Configure email imports from Gmail',
      icon: '📧',
    },
    {
      to: '/admin/dead-links',
      label: 'Dead Links',
      description: 'View and manage broken links',
      icon: '🔗',
    },
    {
      to: '/admin/tags',
      label: 'Tags',
      description: 'Organize and manage your tags',
      icon: '🏷️',
    },
    {
      to: '/admin/general',
      label: 'General Settings',
      description: 'Adjust general preferences',
      icon: '⚙️',
    },
  ];

  return (
    <div className="px-6 py-6">
      <div className="mb-8">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text mb-1">Admin</h2>
        <p className="text-text-muted font-sans text-[0.9rem]">Manage your schwankie settings and data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block p-6 border border-border rounded-lg hover:border-accent hover:bg-bg-subtle transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{card.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-text mb-1">{card.label}</h3>
                <p className="font-sans text-[0.85rem] text-text-muted">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
