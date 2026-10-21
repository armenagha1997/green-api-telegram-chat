import { observer } from 'mobx-react-lite'
import { ChatWindow } from '@/components/ChatWindow'
import { EmptyState } from '@/components/EmptyState'
import { LoginForm } from '@/components/LoginForm'
import { Sidebar } from '@/components/Sidebar'
import { useStores } from '@/stores/RootStore'
import styles from './App.module.scss'

export const App = observer(function App() {
  const { authStore, chatStore } = useStores()

  if (!authStore.isAuthenticated) {
    return <LoginForm />
  }

  const hasActiveChat = Boolean(chatStore.activeChat)

  return (
    <div className={styles.layout}>
      <div className={hasActiveChat ? `${styles.pane} ${styles.hiddenOnMobile}` : styles.pane}>
        <Sidebar />
      </div>
      <main className={hasActiveChat ? styles.main : `${styles.main} ${styles.hiddenOnMobile}`}>
        {chatStore.activeChat ? <ChatWindow /> : <EmptyState />}
      </main>
    </div>
  )
})
