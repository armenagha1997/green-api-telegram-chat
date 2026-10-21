import { zodResolver } from '@hookform/resolvers/zod'
import { observer } from 'mobx-react-lite'
import { useForm } from 'react-hook-form'
import { newChatSchema, normalizePhone, type NewChatFormValues } from '@/schemas/newChat'
import { useStores } from '@/stores/RootStore'
import styles from './NewChatModal.module.scss'

interface NewChatModalProps {
  onClose: () => void
}

export const NewChatModal = observer(function NewChatModal({ onClose }: NewChatModalProps) {
  const { chatStore } = useStores()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewChatFormValues>({
    resolver: zodResolver(newChatSchema),
    defaultValues: { phone: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const ok = await chatStore.createChat(normalizePhone(values.phone))
    if (ok) onClose()
  })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
        noValidate
      >
        <h2 className={styles.title}>Новый чат</h2>

        <label className={styles.field}>
          <span>Номер телефона получателя</span>
          <input {...register('phone')} placeholder="+7 999 123-45-67" autoFocus />
          {errors.phone && <span className={styles.error}>{errors.phone.message}</span>}
        </label>

        {chatStore.createChatError && (
          <p className={styles.apiError}>{chatStore.createChatError}</p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className={styles.submit} disabled={chatStore.isCreatingChat}>
            {chatStore.isCreatingChat ? 'Проверяем…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  )
})
