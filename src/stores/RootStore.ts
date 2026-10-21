import { createContext, useContext } from 'react'
import { reaction } from 'mobx'
import { AuthStore } from './AuthStore'
import { ChatStore } from './ChatStore'
import { PollingStore } from './PollingStore'

export class RootStore {
  authStore = new AuthStore()
  chatStore = new ChatStore()
  pollingStore: PollingStore

  constructor() {
    this.pollingStore = new PollingStore(this.chatStore)

    reaction(
      () => this.authStore.isAuthenticated,
      (isAuthenticated) => {
        if (isAuthenticated && this.authStore.api) {
          this.chatStore.setApi(this.authStore.api)
          this.pollingStore.start(this.authStore.api)
        } else {
          this.pollingStore.stop()
          this.chatStore.setApi(null)
          this.chatStore.reset()
        }
      },
      { fireImmediately: true },
    )
  }
}

export const StoresContext = createContext<RootStore | null>(null)

export function useStores(): RootStore {
  const store = useContext(StoresContext)
  if (!store) {
    throw new Error('useStores должен использоваться внутри StoresContext.Provider')
  }
  return store
}
