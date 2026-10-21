import { observer } from 'mobx-react-lite'
import { MessageInput } from '@/components/MessageInput'
import { MessageList } from '@/components/MessageList'
import { useStores } from '@/stores/RootStore'
import styles from './ChatWindow.module.scss'

export const ChatWindow = observer(function ChatWindow() {
  const { chatStore } = useStores()
  const chat = chatStore.activeChat
  if (!chat) return null

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <span className={styles.name}>{chat.name || chat.phone || chat.chatId}</span>
      </header>
      <MessageList chat={chat} />
      <MessageInput chatId={chat.chatId} />
    </div>
  )
})
