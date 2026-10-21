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

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>{chatStore.activeChat ? <ChatWindow /> : <EmptyState />}</main>
    </div>
  )
})
