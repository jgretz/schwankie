import {z} from 'zod';
import {linkStatusEnum, type LinkStatus} from 'database';

export const listTagsParamsSchema = z.object({
  status: z.enum(linkStatusEnum.enumValues as [LinkStatus, ...LinkStatus[]]).optional(),
});
