import {useCallback, useState} from 'react';

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  required?: boolean;
  rules?: ValidationRule<T>[];
};

type SchemaConfig<T extends Record<string, unknown>> = {
  [K in keyof T]?: FieldConfig<T[K]>;
};

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

  // Helper to validate a single field
  const validateField = useCallback(
    (fieldName: string, value: unknown): string | undefined => {
      const config = schema[fieldName];

      if (config?.required && !value) {
        return 'Required';
      }

      if (value && config?.rules) {
        for (const rule of config.rules) {
          if (!rule.validate(value as T[string])) {
            return rule.message;
          }
        }
      }

      return undefined;
    },
    [schema],
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string | undefined> = {};
    let isValid = true;

    for (const fieldName of Object.keys(schema)) {
      const value = values[fieldName];
      const fieldError = validateField(fieldName, value);

      if (fieldError) {
        newErrors[fieldName] = fieldError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched((prev) => ({
      ...prev,
      ...Object.keys(schema).reduce((acc, key) => ({...acc, [key]: true}), {}),
    }));
    return isValid;
  }, [schema, values, validateField]);

  const touch = useCallback(
    (field: string) => {
      setTouched((prev) => ({...prev, [field]: true}));
      const value = values[field];
      const fieldError = validateField(field, value);
      setErrors((prev) => ({...prev, [field]: fieldError}));
    },
    [values, validateField],
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
