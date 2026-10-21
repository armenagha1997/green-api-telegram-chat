import { observer } from 'mobx-react-lite'
import { MessageInput } from '@/components/MessageInput'
import { MessageList } from '@/components/MessageList'
import { useStores } from '@/stores/RootStore'
import { getInitials } from '@/utils/getInitials'
import styles from './ChatWindow.module.scss'

export const ChatWindow = observer(function ChatWindow() {
  const { chatStore } = useStores()
  const chat = chatStore.activeChat
  if (!chat) return null

  const displayName = chat.name || chat.phone || chat.chatId

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => chatStore.setActiveChat(null)}
          aria-label="Назад к списку чатов"
        >
          ←
        </button>
        <span className={styles.avatar}>{getInitials(displayName) || '?'}</span>
        <span className={styles.name}>{displayName}</span>
      </header>
      <MessageList chat={chat} />
      {/* key сбрасывает черновик при переключении между чатами */}
      <MessageInput key={chat.chatId} chatId={chat.chatId} />
    </div>
  )
})
