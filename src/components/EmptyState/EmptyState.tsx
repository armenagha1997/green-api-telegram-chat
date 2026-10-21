import styles from './EmptyState.module.scss'

export function EmptyState() {
  return (
    <div className={styles.wrapper}>
      <p>Выберите чат или создайте новый</p>
    </div>
  )
}
