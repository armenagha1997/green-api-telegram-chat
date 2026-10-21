import { observer } from 'mobx-react-lite'
import { LoginForm } from '@/components/LoginForm'
import { useStores } from '@/stores/RootStore'

export const App = observer(function App() {
  const { authStore } = useStores()

  if (!authStore.isAuthenticated) {
    return <LoginForm />
  }

  // Основной layout — Этап 5.
  return null
})
