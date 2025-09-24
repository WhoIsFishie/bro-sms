import { useRef } from 'react'
import { User, Upload, Search } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useContacts } from '../hooks/useContacts'
import { ThemeToggle } from './ThemeToggle'
import { LoadingSpinner } from './LoadingSpinner'
import { formatTime } from '../lib/utils'
import { cn } from '../lib/utils'

export function ContactList() {
  const {
    messages,
    selectedContact,
    searchTerm,
    loading,
    isMobile,
    showContacts,
    dispatch,
    loadFromFile
  } = useApp()
  const contacts = useContacts()
  const fileInputRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      loadFromFile(file)
    }
  }

  const handleContactSelect = (contact) => {
    // For message-level results, use the specific message ID, otherwise use first match logic
    const jumpToMessageId = contact.isMessageResult
      ? contact.messageId
      : (searchTerm && contact?.firstMatchMessageId ? contact.firstMatchMessageId : null)

    dispatch({
      type: 'SET_SELECTED_CONTACT',
      payload: contact.contactKey,
      showContacts: isMobile ? false : true,
      jumpToMessageId
    })
  }

  return (
    <div className={cn(
      'bg-card border-r border-border flex flex-col h-full',
      isMobile
        ? `fixed inset-0 z-20 ${showContacts ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`
        : 'w-80 max-w-sm'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-card backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={cn(
                'p-2 rounded-full transition-colors',
                'hover:bg-accent active:bg-accent/80',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Upload SMS JSON file"
            >
              {loading ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Upload size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-none outline-none',
              'bg-muted/50 text-foreground placeholder:text-muted-foreground',
              'focus:bg-muted transition-colors'
            )}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState fileInputRef={fileInputRef} />
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No contacts found
          </div>
        ) : (
          <ContactsList
            contacts={contacts}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ fileInputRef }) {
  return (
    <div className="p-6 text-center">
      <div className="max-w-sm mx-auto">
        <Upload size={64} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">
          No SMS Data Loaded
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Upload your SMS JSON file to start viewing conversations and messages.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Upload SMS JSON File
        </button>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>Supported formats:</p>
          <p>• JSON array of messages</p>
          <p>• Object with &quot;messages&quot; array</p>
        </div>
      </div>
    </div>
  )
}

function ContactsList({ contacts, selectedContact, onContactSelect }) {
  return (
    <div className="divide-y divide-border">
      {contacts.map((contact) => (
        <div
          key={contact.isMessageResult ? `${contact.contactKey}-${contact.messageId}` : contact.contactKey}
          onClick={() => onContactSelect(contact)}
          className={cn(
            'p-4 cursor-pointer transition-colors',
            'hover:bg-accent active:bg-accent/80',
            'focus:outline-none focus:bg-accent',
            selectedContact === contact.contactKey && !contact.isMessageResult && 'bg-accent border-l-4 border-l-primary'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onContactSelect(contact)
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-muted-foreground" />
              {/* Chat bubble indicator for search results */}
              {contact.isMessageResult && (
                <div className={cn(
                  'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center',
                  contact.messageDirection === 'to'
                    ? 'bg-primary'
                    : 'bg-muted-foreground'
                )}>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    contact.messageDirection === 'to'
                      ? 'bg-primary-foreground'
                      : 'bg-card'
                  )} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium truncate text-sm">
                  {contact.name}
                </h3>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatTime(contact.lastTime)}
                </span>
              </div>
              <p className={cn(
                'text-sm truncate pr-2',
                contact.isMessageResult ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {contact.lastMessage}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">
                  {contact.phone !== 'Unknown' ? contact.phone : 'No phone'}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {contact.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center">
                      {contact.unreadCount}
                    </span>
                  )}
                  {!contact.isMessageResult && (
                    <span className="text-xs text-muted-foreground">
                      {contact.totalMessages} msgs
                    </span>
                  )}
                  {contact.isMessageResult && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      contact.messageDirection === 'to'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {contact.messageDirection === 'to' ? 'Sent' : 'Received'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}