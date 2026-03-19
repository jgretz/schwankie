import {z} from 'zod';

// Zod schemas that validate the *string* value for each known setting key.
// Unknown keys are not validated (open registry).
export const settingSchemas: Record<string, z.ZodType<string>> = {
  tagCountFloor: z
    .string()
    .regex(/^\d+$/, 'Must be a positive integer')
    .refine((v) => Number(v) >= 1, 'Must be >= 1'),
};

export function validateSettingValue(
  key: string,
  value: string,
): {success: true} | {success: false; error: string} {
  const schema = settingSchemas[key];
  if (!schema) return {success: true}; // unknown keys pass through
  const result = schema.safeParse(value);
  if (result.success) return {success: true};
  return {success: false, error: result.error.issues[0]?.message ?? 'Invalid value'};
}
