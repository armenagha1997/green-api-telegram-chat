import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { RootStore, StoresContext } from './stores/RootStore'
import './styles/global.scss'

const rootStore = new RootStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoresContext.Provider value={rootStore}>
      <App />
    </StoresContext.Provider>
  </StrictMode>,
)
