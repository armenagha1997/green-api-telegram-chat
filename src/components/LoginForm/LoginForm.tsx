import { zodResolver } from '@hookform/resolvers/zod'
import { observer } from 'mobx-react-lite'
import { useForm } from 'react-hook-form'
import { loginSchema, type LoginFormValues } from '@/schemas/login'
import { useStores } from '@/stores/RootStore'
import styles from './LoginForm.module.scss'

export const LoginForm = observer(function LoginForm() {
  const { authStore } = useStores()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { idInstance: '', apiTokenInstance: '', apiUrl: '' },
  })

  const apiUrl = watch('apiUrl')

  const onSubmit = handleSubmit((values) => {
    void authStore.login(values)
  })

  return (
    <div className={styles.wrapper}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>Telegram Chat</h1>
        <p className={styles.subtitle}>Войдите с данными инстанса GREEN-API</p>

        <label className={styles.field}>
          <span>idInstance</span>
          <input {...register('idInstance')} inputMode="numeric" placeholder="1101123456" />
          {errors.idInstance && <span className={styles.error}>{errors.idInstance.message}</span>}
        </label>

        <label className={styles.field}>
          <span>apiTokenInstance</span>
          <input
            {...register('apiTokenInstance')}
            type="password"
            autoComplete="off"
            placeholder="apiTokenInstance"
          />
          {errors.apiTokenInstance && (
            <span className={styles.error}>{errors.apiTokenInstance.message}</span>
          )}
        </label>

        <label className={styles.field}>
          <span>apiUrl</span>
          <input {...register('apiUrl')} placeholder="https://xxxx.api.green-api.com" />
          {!apiUrl && (
            <span className={styles.hint}>
              Найдите apiUrl в карточке инстанса на{' '}
              <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
                console.green-api.com
              </a>
            </span>
          )}
          {errors.apiUrl && <span className={styles.error}>{errors.apiUrl.message}</span>}
        </label>

        {authStore.error && <p className={styles.apiError}>{authStore.error}</p>}

        <button type="submit" className={styles.submit} disabled={authStore.isLoading}>
          {authStore.isLoading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  )
})
