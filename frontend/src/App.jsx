import React from 'react'
import { AppRouter } from './routes'
import { NotificationsProvider } from './context/NotificationsContext'

function App() {
  return (
    <NotificationsProvider>
      <AppRouter />
    </NotificationsProvider>
  )
}

export default App
