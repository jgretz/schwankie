import {useCallback, useState} from 'react';

type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  required?: boolean;
  rules?: ValidationRule<T>[];
};

type SchemaConfig = Record<string, FieldConfig<any>>;

type UseFormValidationReturn = {
  errors: Record<string, string | undefined>;
  validate: () => boolean;
  touch: (field: string) => void;
  touched: Record<string, boolean>;
  isValid: boolean;
  reset: () => void;
};

export function useFormValidation(
  schema: SchemaConfig,
  values: Record<string, any>,
): UseFormValidationReturn {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Helper to validate a single field
  const validateField = useCallback(
    (fieldName: string, value: any): string | undefined => {
      const config = schema[fieldName];

      if (config?.required && !value) {
        return 'Required';
      }

      if (value && config?.rules) {
        for (const rule of config.rules) {
          if (!rule.validate(value)) {
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

  // Compute isValid from current values, not stale errors state
  const isValid = Object.keys(schema).every((fieldName) => {
    const value = values[fieldName];
    return validateField(fieldName, value) === undefined;
  });

  return {
    errors,
    validate,
    touch,
    touched,
    isValid,
    reset,
  };
}
