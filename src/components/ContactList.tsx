import { useState, useMemo } from 'react';
import type { Contact, Message } from '../types';
import { formatMessageTime, getContactDisplayName } from '../utils/messageUtils';
import { getContactColor, getContactTextColor } from '../utils/contactColors';

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onContactSelect: (contactId: string, targetMessageId?: number) => void;
  // Precomputed search index: contactId -> lowercased aggregated text
  searchIndex?: Map<string, string>;
  messagesByContact?: Map<string, Message[]>;
}

export default function ContactList({ contacts, selectedContactId, onContactSelect, searchIndex, messagesByContact }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    // Prefer precomputed index when available to include all messages without per-keystroke scans
    if (searchIndex && searchIndex.size) {
      return contacts.filter(contact => {
        const contactId = contact.normalizedPhone || contact.phone;
        const haystack = searchIndex.get(contactId);
        if (!haystack) return false;
        return haystack.includes(query);
      });
    }

    // Fallback: lightweight client-side matching on visible fields
    return contacts.filter(contact => {
      const displayName = getContactDisplayName(contact).toLowerCase();
      const phone = contact.phone.toLowerCase();
      const lastMessage = contact.lastMessage.toLowerCase();
      return (
        displayName.includes(query) ||
        phone.includes(query) ||
        lastMessage.includes(query)
      );
    });
  }, [contacts, searchQuery, searchIndex]);

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Compute first match snippet and message id per contact when searching
  const matchMetaByContact = useMemo(() => {
    const result = new Map<string, { snippet: string; messageId: number }>();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return result;

    filteredContacts.forEach(contact => {
      const contactId = contact.normalizedPhone || contact.phone;
      const messages = messagesByContact?.get(contactId) || [];
      for (const m of messages) {
        const text = m.text || '';
        const idx = text.toLowerCase().indexOf(query);
        if (idx >= 0) {
          const start = Math.max(0, idx - 20);
          const end = Math.min(text.length, idx + query.length + 20);
          const prefix = start > 0 ? '…' : '';
          const suffix = end < text.length ? '…' : '';
          const snippet = prefix + text.slice(start, end) + suffix;
          result.set(contactId, { snippet, messageId: m.id });
          break;
        }
      }
    });
    return result;
  }, [filteredContacts, searchQuery, messagesByContact]);

  return (
    <div className="flex flex-col h-full w-full bg-white border-r border-gray-200">
      {/* Search bar (acts as header row to align with right pane header) */}
      <div className="h-17 px-4 border-b border-gray-100 bg-white flex items-center sticky top-0 z-10">
        <div className="relative w-full">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-gray-100 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-transparent text-sm placeholder:text-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.468L3 21l1.468-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
              <p className="text-sm">{searchQuery ? 'No matching conversations' : 'No conversations'}</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const contactId = contact.normalizedPhone || contact.phone;
            const isSelected = contactId === selectedContactId;
            const displayName = getContactDisplayName(contact);
            const avatarColor = getContactColor(contactId);
            const textColor = getContactTextColor();

            return (
              <div
                key={contactId}
                onClick={() => {
                  const targetId = matchMetaByContact.get(contactId)?.messageId;
                  onContactSelect(contactId, targetId);
                }}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center shadow-inner`}>
                  {contact.name && contact.name !== 'Unknown' ? (
                    <span className={`text-sm font-medium ${textColor}`}>
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg className={`w-6 h-6 ${textColor}`} fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Contact info */}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium truncate tracking-tight ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {highlightSearchTerm(displayName, searchQuery)}
                    </p>
                    <p className={`text-[11px] md:text-xs ${
                      isSelected ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(contact.lastMessageTime)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-sm truncate ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {highlightSearchTerm(contact.lastMessage, searchQuery)}
                    </p>

                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {contact.messageCount > 1 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {contact.messageCount}
                        </span>
                      )}

                      {!contact.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Matching snippet when searching */}
                  {searchQuery && matchMetaByContact.get(contactId)?.snippet && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const meta = matchMetaByContact.get(contactId);
                        if (meta) onContactSelect(contactId, meta.messageId);
                      }}
                      className="block w-full text-left text-xs mt-1 text-gray-500 hover:text-blue-700"
                      title="Jump to match"
                    >
                      {highlightSearchTerm(matchMetaByContact.get(contactId)!.snippet, searchQuery)}
                    </button>
                  )}

                  {/* Phone number if different from name */}
                  {contact.name && contact.name !== 'Unknown' && (
                    <p className={`text-xs mt-1 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {highlightSearchTerm(contact.phone, searchQuery)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}