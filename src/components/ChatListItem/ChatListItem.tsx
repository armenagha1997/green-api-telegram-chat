import { format } from 'date-fns'
import type { Chat } from '@/stores/ChatStore'
import { getInitials } from '@/utils/getInitials'
import styles from './ChatListItem.module.scss'

interface ChatListItemProps {
  chat: Chat
  active: boolean
  onClick: () => void
}

export function ChatListItem({ chat, active, onClick }: ChatListItemProps) {
  const lastMessage = chat.messages.at(-1)
  const displayName = chat.name || chat.phone || chat.chatId
  const initials = getInitials(displayName) || '?'

  return (
    <button
      type="button"
      className={active ? `${styles.item} ${styles.active}` : styles.item}
      onClick={onClick}
    >
      <span className={styles.avatar}>{initials}</span>
      <span className={styles.body}>
        <span className={styles.row}>
          <span className={styles.name}>{displayName}</span>
          {lastMessage && (
            <span className={styles.time}>{format(lastMessage.timestamp, 'HH:mm')}</span>
          )}
        </span>
        <span className={styles.row}>
          <span className={styles.preview}>{lastMessage?.text ?? ''}</span>
          {chat.unread > 0 && <span className={styles.badge}>{chat.unread}</span>}
        </span>
      </span>
    </button>
  )
}
