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
};

export function useFormValidation(
  schema: SchemaConfig,
  values: Record<string, any>,
): UseFormValidationReturn {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string | undefined> = {};
    let isValid = true;

    for (const [fieldName, config] of Object.entries(schema)) {
      const value = values[fieldName];

      if (config.required && !value) {
        newErrors[fieldName] = 'Required';
        isValid = false;
      } else if (value && config.rules) {
        for (const rule of config.rules) {
          if (!rule.validate(value)) {
            newErrors[fieldName] = rule.message;
            isValid = false;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    setTouched((prev) => ({
      ...prev,
      ...Object.keys(schema).reduce((acc, key) => ({...acc, [key]: true}), {}),
    }));
    return isValid;
  }, [schema, values]);

  const touch = useCallback(
    (field: string) => {
      setTouched((prev) => ({...prev, [field]: true}));

      const config = schema[field];
      const value = values[field];
      let fieldError: string | undefined;

      if (config?.required && !value) {
        fieldError = 'Required';
      } else if (value && config?.rules) {
        for (const rule of config.rules) {
          if (!rule.validate(value)) {
            fieldError = rule.message;
            break;
          }
        }
      }

      setErrors((prev) => ({...prev, [field]: fieldError}));
    },
    [schema, values],
  );

  const isValid = Object.keys(errors).every((key) => !errors[key]);

  return {
    errors,
    validate,
    touch,
    touched,
    isValid,
  };
}
