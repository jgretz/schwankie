import {useCallback, useState, type KeyboardEvent} from 'react';

type TagChipInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagChipInput({tags, onChange}: TagChipInputProps) {
  const [input, setInput] = useState('');

  const addTag = useCallback(
    (raw: string) => {
      const text = raw.trim().toLowerCase();
      if (text && !tags.includes(text)) {
        onChange([...tags, text]);
      }
      setInput('');
    },
    [tags, onChange],
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    },
    [tags, onChange],
  );

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg px-2.5 py-1.5 transition-colors focus-within:border-accent">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-[3px] bg-tag-bg px-2 py-[2px] font-sans text-[0.75rem] text-tag-text"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="ml-0.5 text-tag-text/60 transition-colors hover:text-tag-text"
            aria-label={`Remove ${tag}`}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addTag(input);
        }}
        placeholder={tags.length === 0 ? 'Add tags…' : ''}
        className="min-w-[80px] flex-1 bg-transparent font-sans text-[0.85rem] text-text outline-none placeholder:text-text-faint"
      />
    </div>
  );
}
