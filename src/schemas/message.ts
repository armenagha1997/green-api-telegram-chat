import { z } from 'zod'

export const messageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Введите сообщение')
    .max(4096, 'Сообщение слишком длинное (максимум 4096 символов)'),
})

export type MessageFormValues = z.infer<typeof messageSchema>
