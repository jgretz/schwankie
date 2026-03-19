import {describe, it, expect} from 'bun:test';
import {
  validateField,
  validateAll,
  type FieldConfig,
  type SchemaConfig,
  type ValidationRule,
} from '../../../src/components/modal/form-validation';

describe('validateField', () => {
  it('returns undefined for valid non-required field with no rules', () => {
    const config: FieldConfig<string> = {};
    const result = validateField(config, 'some value');
    expect(result).toBeUndefined();
  });

  it('returns undefined when config is undefined', () => {
    const result = validateField(undefined, 'some value');
    expect(result).toBeUndefined();
  });

  it("returns 'Required' when field is required and value is empty string", () => {
    const config: FieldConfig<string> = {required: true};
    const result = validateField(config, '');
    expect(result).toBe('Required');
  });

  it("returns 'Required' when field is required and value is null", () => {
    const config: FieldConfig<string> = {required: true};
    const result = validateField(config, null);
    expect(result).toBe('Required');
  });

  it("returns 'Required' when field is required and value is undefined", () => {
    const config: FieldConfig<string> = {required: true};
    const result = validateField(config, undefined);
    expect(result).toBe('Required');
  });

  it('returns undefined when field is required and value is truthy', () => {
    const config: FieldConfig<string> = {required: true};
    const result = validateField(config, 'value');
    expect(result).toBeUndefined();
  });

  it("returns rule's message when a custom rule fails", () => {
    const rules: ValidationRule<string>[] = [
      {
        validate: (value) => value.length > 5,
        message: 'Must be longer than 5 characters',
      },
    ];
    const config: FieldConfig<string> = {rules};
    const result = validateField(config, 'abc');
    expect(result).toBe('Must be longer than 5 characters');
  });

  it('returns undefined when all rules pass', () => {
    const rules: ValidationRule<string>[] = [
      {
        validate: (value) => value.length > 5,
        message: 'Must be longer than 5 characters',
      },
    ];
    const config: FieldConfig<string> = {rules};
    const result = validateField(config, 'abcdefgh');
    expect(result).toBeUndefined();
  });

  it("returns first failing rule's message when multiple rules exist", () => {
    const rules: ValidationRule<string>[] = [
      {
        validate: (value) => value.length > 5,
        message: 'Must be longer than 5 characters',
      },
      {
        validate: (value) => value.includes('@'),
        message: 'Must include @ symbol',
      },
    ];
    const config: FieldConfig<string> = {rules};
    const result = validateField(config, 'abc');
    expect(result).toBe('Must be longer than 5 characters');
  });

  it("returns second rule's message when first passes but second fails", () => {
    const rules: ValidationRule<string>[] = [
      {
        validate: (value) => value.length > 5,
        message: 'Must be longer than 5 characters',
      },
      {
        validate: (value) => value.includes('@'),
        message: 'Must include @ symbol',
      },
    ];
    const config: FieldConfig<string> = {rules};
    const result = validateField(config, 'abcdefgh');
    expect(result).toBe('Must include @ symbol');
  });

  it('skips rules when value is falsy (rules only run when value is truthy)', () => {
    const rules: ValidationRule<string>[] = [
      {
        validate: () => {
          throw new Error('Should not be called');
        },
        message: 'Should not be called',
      },
    ];
    const config: FieldConfig<string> = {rules};
    const result = validateField(config, '');
    expect(result).toBeUndefined();
  });

  it('returns undefined for non-required field with falsy value', () => {
    const config: FieldConfig<string> = {required: false};
    const result = validateField(config, '');
    expect(result).toBeUndefined();
  });

  it('returns undefined for required field with truthy non-string value', () => {
    const config: FieldConfig<number> = {required: true};
    const result = validateField(config, 0);
    expect(result).toBe('Required');
  });

  it('returns undefined for required field with non-zero number', () => {
    const config: FieldConfig<number> = {required: true};
    const result = validateField(config, 42);
    expect(result).toBeUndefined();
  });
});

describe('validateAll', () => {
  it('returns { errors: {}, isValid: true } when all fields valid', () => {
    const schema: SchemaConfig<{name: string; email: string}> = {
      name: {required: true},
      email: {required: true},
    };
    const values = {name: 'John', email: 'john@example.com'};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns errors for each invalid field and isValid: false', () => {
    const schema: SchemaConfig<{name: string; email: string}> = {
      name: {required: true},
      email: {required: true},
    };
    const values = {name: '', email: ''};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({name: 'Required', email: 'Required'});
  });

  it('only validates fields present in the schema (ignores extra values)', () => {
    const schema: SchemaConfig<{name: string}> = {
      name: {required: true},
    };
    const values = {name: 'John', extraField: 'ignored'} as any;
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(Object.keys(result.errors)).not.toContain('extraField');
  });

  it('handles mixed valid/invalid fields correctly', () => {
    const schema: SchemaConfig<{name: string; email: string; age: number}> = {
      name: {required: true},
      email: {required: true},
      age: {required: false},
    };
    const values = {name: 'John', email: '', age: 25};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({name: undefined, email: 'Required', age: undefined});
  });

  it('returns undefined for valid optional fields', () => {
    const schema: SchemaConfig<{name: string; nickname: string}> = {
      name: {required: true},
      nickname: {required: false},
    };
    const values = {name: 'John', nickname: ''};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(true);
    expect(result.errors.nickname).toBeUndefined();
  });

  it('validates fields with custom rules', () => {
    const emailRule: ValidationRule<string> = {
      validate: (value) => value.includes('@'),
      message: 'Invalid email format',
    };
    const schema: SchemaConfig<{email: string}> = {
      email: {required: true, rules: [emailRule]},
    };
    const values = {email: 'invalid'};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Invalid email format');
  });

  it('validates all fields even when some fail', () => {
    const lengthRule: ValidationRule<string> = {
      validate: (value) => value.length >= 3,
      message: 'Must be at least 3 characters',
    };
    const schema: SchemaConfig<{username: string; password: string}> = {
      username: {required: true, rules: [lengthRule]},
      password: {required: true, rules: [lengthRule]},
    };
    const values = {username: 'ab', password: 'ok'};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      username: 'Must be at least 3 characters',
      password: 'Must be at least 3 characters',
    });
  });

  it('handles empty schema', () => {
    const schema: SchemaConfig<Record<string, never>> = {};
    const values = {};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('handles schema with no validation rules', () => {
    const schema: SchemaConfig<{field: string}> = {
      field: {},
    };
    const values = {field: ''};
    const result = validateAll(schema, values);
    expect(result.isValid).toBe(true);
    expect(result.errors.field).toBeUndefined();
  });

  it('stops at first failing rule per field', () => {
    const rule1: ValidationRule<string> = {
      validate: (value) => value.length > 5,
      message: 'Rule 1 failed',
    };
    const rule2: ValidationRule<string> = {
      validate: () => {
        throw new Error('Should not be called');
      },
      message: 'Rule 2 failed',
    };
    const schema: SchemaConfig<{name: string}> = {
      name: {rules: [rule1, rule2]},
    };
    const values = {name: 'abc'};
    const result = validateAll(schema, values);
    expect(result.errors.name).toBe('Rule 1 failed');
  });
});
