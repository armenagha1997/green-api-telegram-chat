import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { ChatListItem } from '@/components/ChatListItem'
import { NewChatModal } from '@/components/NewChatModal'
import { useStores } from '@/stores/RootStore'
import styles from './Sidebar.module.scss'

export const Sidebar = observer(function Sidebar() {
  const { authStore, chatStore } = useStores()
  const [isModalOpen, setModalOpen] = useState(false)

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <button type="button" className={styles.newChatButton} onClick={() => setModalOpen(true)}>
          + Новый чат
        </button>
        <button type="button" className={styles.logoutButton} onClick={() => authStore.logout()}>
          Выйти
        </button>
      </header>

      <div className={styles.list}>
        {chatStore.chatList.length === 0 && (
          <p className={styles.emptyHint}>Чатов пока нет — создайте новый</p>
        )}
        {chatStore.chatList.map((chat) => (
          <ChatListItem
            key={chat.chatId}
            chat={chat}
            active={chat.chatId === chatStore.activeChatId}
            onClick={() => chatStore.setActiveChat(chat.chatId)}
          />
        ))}
      </div>

      {isModalOpen && <NewChatModal onClose={() => setModalOpen(false)} />}
    </aside>
  )
})
