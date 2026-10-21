import { format } from 'date-fns'
import type { Message } from '@/stores/ChatStore'
import styles from './MessageBubble.module.scss'

interface MessageBubbleProps {
  message: Message
  onRetry?: () => void
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isOut = message.direction === 'out'

  return (
    <div className={isOut ? `${styles.bubble} ${styles.out}` : `${styles.bubble} ${styles.in}`}>
      <p className={styles.text}>{message.text}</p>
      <div className={styles.meta}>
        {isOut && message.status === 'sending' && <span className={styles.status}>…</span>}
        {isOut && message.status === 'error' && (
          <button type="button" className={styles.retry} onClick={onRetry}>
            Повторить
          </button>
        )}
        <span className={styles.time}>{format(message.timestamp, 'HH:mm')}</span>
      </div>
    </div>
  )
}
