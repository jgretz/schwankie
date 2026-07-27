import {z} from 'zod';

export const settingKeyParamSchema = z.object({
  key: z.string().min(1),
});

export const updateSettingSchema = z.object({
  value: z.string(),
});
