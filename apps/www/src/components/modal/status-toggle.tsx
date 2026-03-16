import {cn} from '@www/lib/utils';

type StatusToggleProps = {
  value: 'saved' | 'queued';
  onChange: (value: 'saved' | 'queued') => void;
};

const options: Array<{label: string; value: 'saved' | 'queued'}> = [
  {label: 'Feed', value: 'saved'},
  {label: 'Queue', value: 'queued'},
];

export function StatusToggle({value, onChange}: StatusToggleProps) {
  return (
    <div className="mb-5 flex overflow-hidden rounded-[6px] border border-border">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 px-3 py-2 text-center font-sans text-[0.82rem] font-medium transition-colors',
            i > 0 && 'border-l border-border',
            value === opt.value
              ? 'bg-accent text-white'
              : 'bg-transparent text-text-muted hover:bg-bg-subtle',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
