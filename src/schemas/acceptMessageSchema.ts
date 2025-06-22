import {z} from 'zod';

export const atcceptMessagesSchema = z.object({
    acceptMessages: z.boolean(),
})