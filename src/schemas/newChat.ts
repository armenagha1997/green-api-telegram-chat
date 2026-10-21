import { z } from 'zod'

export const newChatSchema = z.object({
  phone: z.string().trim().min(1, 'Введите номер телефона').refine(
    (value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length >= 7 && digits.length <= 15
    },
    { message: 'Номер должен содержать от 7 до 15 цифр' },
  ),
})

export type NewChatFormValues = z.infer<typeof newChatSchema>

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}
