import { zodResolver } from '@hookform/resolvers/zod'
import { observer } from 'mobx-react-lite'
import type { KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { messageSchema, type MessageFormValues } from '@/schemas/message'
import { useStores } from '@/stores/RootStore'
import styles from './MessageInput.module.scss'

interface MessageInputProps {
  chatId: string
}

export const MessageInput = observer(function MessageInput({ chatId }: MessageInputProps) {
  const { chatStore } = useStores()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { text: '' },
  })

  const { ref, ...textareaProps } = register('text')

  const onSubmit = handleSubmit((values) => {
    void chatStore.send(chatId, values.text.trim())
    reset()
  })

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void onSubmit()
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <textarea
          {...textareaProps}
          ref={ref}
          onKeyDown={onKeyDown}
          placeholder="Написать сообщение…"
          rows={1}
        />
        {errors.text && <span className={styles.error}>{errors.text.message}</span>}
      </div>
      <button type="submit" className={styles.send} aria-label="Отправить">
        ➤
      </button>
    </form>
  )
})
