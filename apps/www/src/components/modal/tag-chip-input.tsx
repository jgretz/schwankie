import {type KeyboardEvent, useRef, useState} from 'react';

type TagChipInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagChipInput({tags, onChange}: TagChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInputValue('');
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  function handleInputChange(value: string) {
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.slice(0, -1).forEach((part) => addTag(part));
      setInputValue(parts[parts.length - 1] ?? '');
    } else {
      setInputValue(value);
    }
  }

  return (
    <div
      className="flex min-h-[38px] cursor-text flex-wrap gap-[0.35rem] rounded-[5px] border border-border bg-bg px-2 py-[6px] transition-colors focus-within:border-accent"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-[3px] bg-tag-bg px-2 py-[2px] font-sans text-[0.75rem] text-tag-text"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
            className="cursor-pointer opacity-60 transition-opacity hover:opacity-100"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? 'add tag\u2026' : ''}
        className="min-w-[80px] flex-1 border-none bg-transparent font-sans text-[0.875rem] text-text outline-none placeholder:text-text-faint"
      />
    </div>
  );
}
