import {useCallback, useState} from 'react';
import {type SchemaConfig, validateAll, validateField} from './form-validation';

export type {FieldConfig, SchemaConfig} from './form-validation';
export type {ValidationRule} from './form-validation';

type UseFormValidationReturn = {
  errors: Record<string, string | undefined>;
  validate: () => boolean;
  touch: (field: string) => void;
  touched: Record<string, boolean>;
  reset: () => void;
};

export function useFormValidation<T extends Record<string, unknown>>(
  schema: SchemaConfig<T>,
  values: T,
): UseFormValidationReturn {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validate = useCallback(() => {
    const result = validateAll(schema, values);

    setErrors(result.errors);
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(schema).map((key) => [key, true])),
    }));
    return result.isValid;
  }, [schema, values]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: biome 1.5.3 demands member expressions (schema[field], values[field]) as literal deps — not expressible; schema and values are the correct deps
  const touch = useCallback(
    (field: string) => {
      setTouched((prev) => ({...prev, [field]: true}));
      const value = values[field];
      const fieldError = validateField(schema[field], value);
      setErrors((prev) => ({...prev, [field]: fieldError}));
    },
    [schema, values],
  );

  const reset = useCallback(() => {
    setTouched({});
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    touch,
    touched,
    reset,
  };
}
