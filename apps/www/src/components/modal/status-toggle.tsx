import {cn} from '@www/lib/utils';

type StatusToggleProps = {
  value: 'saved' | 'queued';
  onChange: (value: 'saved' | 'queued') => void;
};

const options: {value: 'saved' | 'queued'; label: string}[] = [
  {value: 'saved', label: 'Compendium'},
  {value: 'queued', label: 'Queue'},
];

export function StatusToggle({value, onChange}: StatusToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-border bg-bg-subtle p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-[4px] px-3 py-1 font-sans text-[0.8rem] font-medium transition-colors',
            value === opt.value ? 'bg-bg text-text shadow-sm' : 'text-text-muted hover:text-text',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
