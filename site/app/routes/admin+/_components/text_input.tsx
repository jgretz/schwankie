interface Props<T extends string | number | undefined> {
  label: string;
  name: string;
  type?: string;
  value?: T;
  defaultValue?: T;
  error?: string;
}

export function TextInput<T extends string | number | undefined>({
  label,
  name,
  type,
  value,
  defaultValue,
  error,
}: Props<T>) {
  return (
    <div className="flex mt-5 w-full">
      <div className="w-full">
        <label className="inline-block">{label}</label>
        <input
          className="w-full"
          type={type || 'text'}
          name={name}
          value={value}
          defaultValue={defaultValue}
        />
      </div>
      <div>{error}</div>
    </div>
  );
}
