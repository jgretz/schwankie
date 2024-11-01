import type {FieldMetadata} from '@conform-to/react';

interface Props<T extends string | number | null | undefined> {
  label?: string;
  type?: string;
  field: FieldMetadata<T>;
}

export function TextInput<T extends string | number | null | undefined>({
  label,
  type,
  field,
}: Props<T>) {
  return (
    <div className="flex flex-col mt-5 w-full">
      <div className="w-full">
        <label className="inline-block">{label}</label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          type={type || 'text'}
          key={field.key}
          name={field.name}
          defaultValue={field.initialValue}
        />
      </div>
      <div className="text-red-500">{field.errors?.join('<br />')}</div>
    </div>
  );
}
