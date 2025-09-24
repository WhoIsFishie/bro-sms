import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, User, MessageCircle, Upload, Search, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useContacts } from '../hooks/useContacts'
import { useMessages } from '../hooks/useMessages'
import { ThemeToggle } from './ThemeToggle'
import { LoadingSpinner } from './LoadingSpinner'
import { formatTime } from '../lib/utils'
import { cn } from '../lib/utils'

export function MessageView() {
  const {
    selectedContact,
    isMobile,
    dispatch,
    loadedMessages,
    messageSearchTerm,
    jumpToMessageId
  } = useApp()
  const contacts = useContacts()
  const { messages, totalMessages, hasMoreMessages } = useMessages(selectedContact)
  const messagesEndRef = useRef(null)
  const [showSearch, setShowSearch] = useState(false)

  const contact = contacts.find(c => c.contactKey === selectedContact)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Handle jumping to specific message
  useEffect(() => {
    if (jumpToMessageId) {
      const targetElement = document.getElementById(`message-${jumpToMessageId}`)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Clear the jump after scrolling
        setTimeout(() => {
          dispatch({ type: 'CLEAR_JUMP_TO_MESSAGE' })
        }, 1000)
      }
    }
  }, [jumpToMessageId, messages, dispatch])

  const handleBackToContacts = () => {
    dispatch({ type: 'SET_SHOW_CONTACTS', payload: true })
    dispatch({ type: 'SET_SELECTED_CONTACT', payload: null })
  }

  const loadMoreMessages = () => {
    dispatch({ type: 'SET_LOADED_MESSAGES', payload: loadedMessages + 50 })
  }

  if (!selectedContact || !contact) {
    return <EmptyMessageView />
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={handleBackToContacts}
                className="p-1.5 hover:bg-accent rounded-full transition-colors -ml-1"
              >
                <ArrowLeft size={20} className="text-primary" />
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base truncate">
                {contact.name}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {contact.phone !== 'Unknown' ? contact.phone : 'No phone number'}
              </p>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-accent rounded-full transition-colors"
              title="Search messages"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearchTerm}
                onChange={(e) => dispatch({ type: 'SET_MESSAGE_SEARCH_TERM', payload: e.target.value })}
                className={cn(
                  'w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-border',
                  'bg-background text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
              />
              {messageSearchTerm && (
                <button
                  onClick={() => dispatch({ type: 'SET_MESSAGE_SEARCH_TERM', payload: '' })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} jumpToMessageId={jumpToMessageId} />
        ))}

        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="text-center pt-4">
            <button
              onClick={loadMoreMessages}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Load More Messages ({totalMessages - loadedMessages} remaining)
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

function MessageBubble({ message, jumpToMessageId }) {
  const { searchTerm } = useApp()
  const isOutgoing = message.party.direction === 'to'
  const isJumpTarget = jumpToMessageId && message.id.toString() === jumpToMessageId.toString()
  const hasSearchMatch = searchTerm && message.message.toLowerCase().includes(searchTerm.toLowerCase())

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        'flex mb-1 transition-all duration-300',
        isOutgoing ? 'justify-end' : 'justify-start',
        isJumpTarget && 'animate-pulse'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] px-4 py-2.5 shadow-sm transition-all duration-300',
          isOutgoing
            ? 'bg-primary text-primary-foreground rounded-3xl rounded-br-lg'
            : 'bg-card text-card-foreground rounded-3xl rounded-bl-lg border border-border/50',
          isJumpTarget && 'ring-2 ring-primary ring-opacity-50',
          hasSearchMatch && !isOutgoing && 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
          hasSearchMatch && isOutgoing && 'bg-primary/90 ring-1 ring-primary-foreground/20'
        )}
      >
        <p className="text-[15px] leading-5 break-words">{message.message}</p>
        <div className={cn(
          'flex items-center gap-1 mt-1 text-[11px]',
          isOutgoing ? 'text-primary-foreground/60 justify-end' : 'text-muted-foreground'
        )}>
          <span>{formatTime(message.time)}</span>
          {isOutgoing && (
            <span className="ml-1 text-[10px]">
              {message.status === 'Sent' ? '✓' : '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyMessageView() {
  const fileInputRef = useRef(null)
  const { loadFromFile, loadFromUrl, loading } = useApp()
  const [urlInput, setUrlInput] = useState('')

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      loadFromFile(file)
    }
  }

  const handleUrlSubmit = (e) => {
    e.preventDefault()
    if (urlInput.trim()) {
      loadFromUrl(urlInput.trim())
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold">SMS Visualizer</h1>
          <p className="text-xs text-muted-foreground">Import your conversations</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Icon */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome</h2>
            <p className="text-sm text-muted-foreground">
              Import your SMS data to get started
            </p>
          </div>

          {/* Upload section */}
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={cn(
                'w-full py-4 px-6 rounded-2xl font-medium transition-all',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-3',
                'shadow-lg hover:shadow-xl'
              )}
            >
              {loading ? (
                <>
                  <LoadingSpinner className="h-5 w-5" />
                  Loading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload JSON File
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Smart URL input */}
            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter URL or pastebin key..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={loading}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl border border-border',
                    'bg-background text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'text-sm'
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className={cn(
                  'w-full py-3 px-6 rounded-xl font-medium transition-all',
                  'bg-secondary text-secondary-foreground border border-border',
                  'hover:bg-secondary/80 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'text-sm'
                )}
              >
                Load from URL
              </button>
            </form>
          </div>

          {/* Help section */}
          <details className="text-center">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              Need help?
            </summary>
            <div className="mt-4 p-4 bg-muted/30 rounded-xl text-left space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Expected format:</h4>
                <pre className="text-xs text-muted-foreground bg-background p-2 rounded overflow-x-auto">
{`[{
  "id": 1,
  "party": {
    "direction": "from",
    "phone": "+1234567890",
    "name": "Contact"
  },
  "time": {
    "date": "01/10/2014",
    "time": "10:46:46(UTC+0)"
  },
  "message": "Hello!",
  "status": "Read"
}]`}
                </pre>
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>Supported sources:</strong></p>
                <ul className="text-left space-y-1 ml-4">
                  <li>• <strong>Direct JSON:</strong> Any URL ending in .json or serving JSON content</li>
                  <li>• <strong>Pastebin:</strong> Key (e.g., &quot;abc123&quot;) or full URL</li>
                  <li>• <strong>GitHub:</strong> Raw file URLs or repository blob URLs</li>
                  <li>• <strong>GitHub Pages:</strong> JSON files hosted on github.io domains</li>
                  <li>• <strong>Internet Archive:</strong> Direct JSON file URLs</li>
                </ul>
              </div>
            </div>
          </details>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}