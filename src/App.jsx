import { ThemeProvider } from './contexts/ThemeContext'
import { AppProvider } from './contexts/AppContext'
import { ContactList } from './components/ContactList'
import { MessageView } from './components/MessageView'
import { ErrorAlert } from './components/ErrorAlert'
import { useApp } from './contexts/AppContext'
import { cn } from './lib/utils'

function AppContent() {
  const { isMobile, showContacts, messages, loading } = useApp()
  const hasData = messages.length > 0

  // Show full-screen welcome when no data
  if (!hasData && !loading) {
    return (
      <div className="h-screen bg-background text-foreground">
        <MessageView />
        <ErrorAlert />
      </div>
    )
  }

  // Show sidebar + messages when data is loaded
  return (
    <div className="flex h-screen bg-background text-foreground">
      <ContactList />
      <div className={cn(
        'flex-1 flex flex-col',
        isMobile && !showContacts ? 'w-full' : isMobile ? 'hidden' : ''
      )}>
        <MessageView />
      </div>
      <ErrorAlert />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider storageKey="bro-sms-theme">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  )
}

export default App