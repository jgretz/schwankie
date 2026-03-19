export type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

export type FieldConfig<T> = {
  required?: boolean;
  rules?: ValidationRule<T>[];
};

export type SchemaConfig<T extends Record<string, unknown>> = {
  [K in keyof T]?: FieldConfig<T[K]>;
};

export type ValidationResult = {
  errors: Record<string, string | undefined>;
  isValid: boolean;
};

export function validateField<T>(
  config: FieldConfig<T> | undefined,
  value: unknown,
): string | undefined {
  if (config?.required && !value) {
    return 'Required';
  }

  if (value && config?.rules) {
    for (const rule of config.rules) {
      if (!rule.validate(value as T)) {
        return rule.message;
      }
    }
  }

  return undefined;
}

export function validateAll<T extends Record<string, unknown>>(
  schema: SchemaConfig<T>,
  values: T,
): ValidationResult {
  const errors: Record<string, string | undefined> = {};
  let isValid = true;

  for (const fieldName of Object.keys(schema)) {
    const fieldError = validateField(schema[fieldName], values[fieldName]);

    if (fieldError) {
      errors[fieldName] = fieldError;
      isValid = false;
    }
  }

  return {errors, isValid};
}
